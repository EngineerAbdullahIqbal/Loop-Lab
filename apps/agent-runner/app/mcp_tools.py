"""MCP tool provider — fetch REAL data through allowlisted stdio MCP servers.

Client usage grounded in current MCP Python SDK docs: StdioServerParameters +
stdio_client + ClientSession.initialize / list_tools / call_tool. Guarded import.

Config via env MCP_SERVERS (JSON), e.g.:
  [{"command":"uvx","args":["mcp-server-fetch"]}]
Only read-only tools should be allowlisted (Constitution VI).
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

from .models import ToolSchema

try:  # guarded
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except Exception:  # pragma: no cover - import guard
    ClientSession = None  # type: ignore[assignment]
    StdioServerParameters = None  # type: ignore[assignment]
    stdio_client = None  # type: ignore[assignment]


def mcp_available() -> bool:
    return ClientSession is not None


def load_servers_from_env() -> list[Any]:
    """Parse MCP_SERVERS into StdioServerParameters. Empty when unset/unavailable."""
    raw = os.environ.get("MCP_SERVERS", "").strip()
    if not raw or not mcp_available():
        return []
    try:
        specs = json.loads(raw)
    except json.JSONDecodeError:
        return []
    servers = []
    for s in specs:
        servers.append(
            StdioServerParameters(
                command=s["command"],
                args=s.get("args", []),
                env={**os.environ, **s.get("env", {})},
            )
        )
    return servers


class MCPToolProvider:
    simulated = False

    def __init__(self, servers: list[Any]) -> None:
        if not mcp_available():
            raise RuntimeError("mcp SDK not installed")
        self.servers = servers
        self._route: dict[str, Any] = {}

    async def list_tools(self) -> list[ToolSchema]:
        schemas: list[ToolSchema] = []
        for sp in self.servers:
            async with stdio_client(sp) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    res = await session.list_tools()
                    for t in res.tools:
                        self._route[t.name] = sp
                        schemas.append(
                            ToolSchema(
                                name=t.name,
                                description=t.description or "",
                                parameters=getattr(t, "inputSchema", None) or {"type": "object", "properties": {}},
                            )
                        )
        return schemas

    async def call(self, name: str, arguments: dict[str, Any]) -> str:
        sp = self._route.get(name)
        if sp is None:
            # discovery may not have run yet in this process; refresh once
            await self.list_tools()
            sp = self._route.get(name)
        if sp is None:
            raise RuntimeError(f"unknown MCP tool: {name}")
        async with stdio_client(sp) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                res = await session.call_tool(name, arguments=arguments)
                parts = [getattr(c, "text", "") for c in res.content]
                text = "\n".join(p for p in parts if p)
                return text or str(res.content)

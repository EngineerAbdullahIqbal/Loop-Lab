"""Build the model + tool provider for a run, degrading gracefully to Simulation."""

from __future__ import annotations

import os
from typing import Optional

from .groq_model import GroqModel, GroqNotConfigured
from .mcp_tools import MCPToolProvider, load_servers_from_env, mcp_available
from .models import Model, ToolProvider
from .simulation import SimulationModel, SimulationTool


def build_runtime(byok_key: Optional[str]) -> tuple[Model, ToolProvider, Optional[str]]:
    """Return (model, tools, note). `note` explains any degradation to the learner."""
    note: Optional[str] = None
    model: Optional[Model] = None

    key = byok_key or os.environ.get("GROQ_API_KEY")
    if key:
        try:
            model = GroqModel(key, os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"))
        except GroqNotConfigured as exc:
            note = f"Groq unavailable ({exc}) — running in Simulation."
    if model is None:
        model = SimulationModel()
        note = note or "No Groq key set — running in labeled Simulation."

    servers = load_servers_from_env()
    if servers and mcp_available():
        tools: ToolProvider = MCPToolProvider(servers)
    else:
        tools = SimulationTool()
        if not servers and not model.simulated:
            note = (note + " " if note else "") + "No MCP server configured — using simulated data."

    return model, tools, note

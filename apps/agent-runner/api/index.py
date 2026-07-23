"""Vercel serverless entry point.

Vercel's Python runtime serves the ASGI `app` exported here. We add the
package root to sys.path so `app.server` (the FastAPI app one level up) imports
cleanly, then re-export it. All routes are already prefixed with /api/, and
vercel.json rewrites every path to this function.
"""

import os
import sys

# apps/agent-runner/ (parent of this api/ dir) → on the path so `import app.*` works.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.server import app  # noqa: E402  (path setup must run first)

# Vercel looks for a module-level `app` (ASGI). Re-exported for clarity.
__all__ = ["app"]

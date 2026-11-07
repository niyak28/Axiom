"""
FastAPI app factory. Mounts REST routes and the Socket.IO ASGI app side by
side, per Section 3 (FastAPI = "central event coordination").
"""

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import rehearsal, notes, qa, telemetry, lecture
from app.sockets.handlers import sio


def create_app() -> FastAPI:
    app = FastAPI(title="Axiom Backend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(rehearsal.router)
    app.include_router(notes.router)
    app.include_router(qa.router)
    app.include_router(telemetry.router)
    app.include_router(lecture.router)

    return app


fastapi_app = create_app()

# Wrap the FastAPI app with the Socket.IO ASGI app so both REST and
# WebSocket traffic are served from one process/port.
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)


# --- Lifecycle ---
# TODO: on startup, warm up Redis/Supabase connections; on shutdown, cancel
# any running `aggregation_loop` / `mock_slider_loop` tasks per active
# lecture. Lecture lifecycle (start/end) itself is undocumented
# (Section 12.8), so there's no hook to start/stop these loops from yet.

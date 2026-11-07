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

    # Hackathon scope: no auth, so CORS just needs to let the frontend
    # through. allow_credentials=True isn't needed without cookies/sessions,
    # so it's left off to allow a wildcard origin if that's ever simpler
    # than maintaining settings.cors_allowed_origins.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
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


if __name__ == "__main__":
    # `python -m app.main` from the backend/ folder.
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)


# --- Lifecycle ---
# TODO: on startup, warm up Redis/Supabase connections; on shutdown, cancel
# any running `aggregation_loop` / `mock_slider_loop` tasks per active
# lecture. Lecture lifecycle (start/end) itself is undocumented
# (Section 12.8), so there's no hook to start/stop these loops from yet.

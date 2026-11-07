"""
Socket.IO event handlers (Section 6).

Each lecture is treated as a Socket.IO "room" (room name = lectureId) so
broadcasts only reach clients connected to that lecture. Rooms aren't
explicitly specified in the project doc, but are implied by the fact that
telemetry/Q&A state is per-lecture — confirm this matches the frontend's
`src/api/socket.js` expectations before relying on it.
"""

import socketio

from app.models.schemas import ToggleQnaPayload, QnaStateChangePayload

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@sio.event
async def connect(sid, environ):
    # Hackathon scope: no auth/identity check on connect. Section 12.10's
    # "no auth mechanism documented" is resolved as "not needed" for this
    # project — don't add a login/token check here unless that changes.
    pass


@sio.event
async def disconnect(sid):
    pass


@sio.on("join_lecture")
async def join_lecture(sid, data):
    """Not in the documented event table but needed to scope broadcasts to
    a room. DECISION NEEDED: confirm event name with frontend, or replace
    with an implicit join derived from connection query params.
    """
    lecture_id = data.get("lectureId")
    if lecture_id:
        await sio.enter_room(sid, lecture_id)


# --- 6.1 Client -> Server: toggle_qna ---
@sio.on("toggle_qna")
async def toggle_qna(sid, data):
    payload = ToggleQnaPayload(**data)
    # TODO: persist isQnaOpen state for the lecture (Redis, likely).
    await sio.emit(
        "qna_state_change",
        QnaStateChangePayload(isQnaOpen=payload.isQnaOpen).model_dump(),
        room=payload.lectureId,
    )


# NOTE: there is intentionally no `cognitive_update` listener here anymore.
# Slider/cognitive scores arrive via POST /api/telemetry/friction (see
# routes/telemetry.py), not over the socket. `CognitiveUpdate` in
# models/schemas.py still describes that payload shape since the REST
# body is identical — only the transport changed.


# --- Server -> Client helpers (called from routes/services, not clients) ---

async def emit_qna_queue_update(lecture_id: str, questions: list[dict]) -> None:
    """Call after an escalation to push the updated queue (Section 6.3)."""
    await sio.emit("qna_queue_update", {"questions": questions}, room=lecture_id)


async def emit_visual_frame_update(lecture_id: str, frame_type: str, data: dict) -> None:
    """Call after note processing produces a visual frame (Section 6.4)."""
    await sio.emit(
        "visual_frame_update",
        {"frameType": frame_type, "data": data},
        room=lecture_id,
    )

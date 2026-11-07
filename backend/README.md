# Axiom Backend

FastAPI backend for Axiom (real-time lecture engagement platform).

This is a **structural skeleton**, not a finished implementation. Routes, socket
handlers, and services are stubbed with `TODO`s and are wired to match the
documented API/WebSocket/DB contract in the project context doc. Several
details (Section 12 "Known Gaps") are intentionally left as decisions to
confirm with the team before implementing — they are marked `# DECISION NEEDED`.

## Layout

```
app/
├── main.py                      # FastAPI app factory, CORS, Socket.IO mount, lifespan (Redis/Supabase)
├── config.py                    # Settings loaded from env vars (pydantic-settings)
├── dependencies.py               # Shared dependency providers (Supabase client, Redis client)
├── routes/
│   ├── rehearsal.py              # POST /api/rehearsal/ping
│   ├── notes.py                  # POST /api/notes/upload
│   ├── qa.py                     # POST /api/qa/ask, POST /api/qa/escalate
│   ├── telemetry.py              # POST /api/telemetry/friction, GET /api/telemetry/heatmap/:lectureId
│   └── lecture.py                 # GET /api/lecture/:id/summary
├── sockets/
│   └── handlers.py               # toggle_qna, qna_state_change, qna_queue_update,
│                                  # visual_frame_update, cognitive_update (TBD direction)
├── services/
│   ├── supabase_client.py        # Supabase client init + table helpers
│   ├── redis_client.py           # Redis client init
│   ├── transcript_buffer.py      # In-memory async transcript chunk buffer
│   ├── telemetry_aggregator.py   # Rolling-average aggregation loop (~2s cadence)
│   └── ai_triage.py               # Async AI question-triage worker
├── models/
│   └── schemas.py                 # Pydantic models mirroring Section 8 payload contract
└── workers/
    └── mock_slider_loop.py        # Demo-only fake telemetry emitter

tests/                             # Postman collection lives outside this skeleton;
                                    # pytest stubs go here for route-level tests
```

## Resolved decisions

- **Telemetry transport (was Section 12.1):** slider/cognitive scores come in
  exclusively via `POST /api/telemetry/friction`. There is no inbound
  `cognitive_update` socket listener — `sockets/handlers.py` no longer
  defines one, and the mock demo loop (`workers/mock_slider_loop.py`) writes
  to Redis directly rather than simulating a socket emit.
- **Auth/RLS (was Section 12.10):** this is a mock hackathon project — no
  authentication, no Supabase RLS policies, no per-route authorization.
  Keep it that way unless the team explicitly asks for it; don't add auth
  scaffolding preemptively.

## Open decisions (do not assume — confirm first)

See Section 12 of the Axiom project context doc:
1. Is `rollingAverage` 0–10 (matches DB) or 0–1 (matches the heatmap API example)?
2. What socket event (if any) broadcasts updated rolling averages to professors?
3. How does `studentId` coexist with "anonymous" submission?
4. Is `POST /api/qa/ask` synchronous (waits for AI answer) or does it return
   immediately and push the answer later over a socket/poll?

## Env vars

See `.env.example`.

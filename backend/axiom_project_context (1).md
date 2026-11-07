# Axiom — Project Context for AI Assistants

> **Purpose of this document:** This is the canonical context handoff for an AI assistant working on the Axiom project. Read it before proposing architecture, writing code, changing schemas, or implementing an API. Treat the contracts below as the project's documented baseline. Do not silently invent missing requirements or change field names, types, routes, or event names.

## 1. Project at a Glance

**Project name:** Axiom

**Project type:** Real-time lecture engagement, student support, and instructor analytics platform

**Primary goal:** Bridge communication and understanding gaps between students and professors during lectures.

Axiom is intended to help students communicate uncertainty and ask questions with less social friction, while giving professors a live view of class comprehension and a way to identify questions that need their attention.

The project concept identifies a reported problem: 47.7% of students do not ask a single question in their lectures across an entire semester. The source document associates this with students feeling intimidated about asking questions and professors having difficulty identifying students' specific misunderstandings. The cited study is:

* https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0243731

### 1.1 Main capabilities

1. **Live transcription and dynamic visuals**

   * Capture lecture audio and produce low-latency transcription.

   * Generate or display math visualizations in the student workspace.

   * The documented visual frame types are `matrix`, `vector_space`, and `graph`.

2. **AI-triaged student questions**

   * Students submit doubts through a private question feed.

   * An AI worker uses buffered lecture transcript context to attempt an answer.

   * The answer should quote the professor's live transcript where possible.

   * The intent is to resolve straightforward questions without interrupting the lecture.

3. **Anonymous, low-friction Q&A**

   * Students can submit and upvote questions anonymously or with reduced social friction.

   * Unresolved questions can be escalated to the professor's Q&A queue.

   * **Implementation note:** The supplied API contract includes a `studentId` field. The exact anonymity/identity model is not fully specified and must be clarified before changing identity handling.

4. **Post-lecture summaries**

   * Compile lecture transcripts, generated visualizations, and comprehension data into study notes.

   * Store Markdown notes, key takeaways, and generated visual artifacts.

5. **Live comprehension telemetry**

   * Students submit a cognitive/confusion score from 1 to 10.

   * The backend aggregates incoming scores into a rolling average.

   * The documented aggregation cadence is every two seconds.

   * Professors see the resulting class-level telemetry, described as a confusion heatmap/dashboard.

## 2. Product Roles and User Flows

### 2.1 Student

A student should be able to:

* Join or view an active lecture.

* Submit a cognitive score from 1 to 10.

* Ask a question privately.

* Receive an AI-generated answer and a supporting transcript quote when available.

* See whether a question was resolved or escalated.

* View incoming math visualizations in the student workspace.

* Access post-lecture notes and generated study artifacts.

### 2.2 Professor

A professor should be able to:

* Create or manage a lecture (the exact creation workflow is not specified).

* View live class comprehension telemetry.

* Open or close the lecture Q&A.

* Receive updates to the escalated-question queue.

* Review lecture analytics, chat logs, and generated summaries after the lecture.

### 2.3 AI question-triage worker

The AI worker should:

* Consume questions and relevant buffered lecture transcript chunks asynchronously.

* Attempt to answer a student's question using lecture context.

* Return an answer, a transcript quote (or `null`), and a `resolved` boolean.

* Escalate unresolved questions to the professor-facing queue.

* Avoid blocking WebSocket/socket event handling while performing LLM work.

**Important:** The source material does not define the LLM provider, model, prompt, context-window strategy, transcript chunk format, timeout policy, retry policy, or confidence threshold. These are open implementation decisions, not established project facts.

## 3. Architecture and Technology

The documented technology choices are:

| Technology | Intended responsibility | 
| ----- | ----- | 
| **React** | Frontend application and student/professor views | 
| **FastAPI (Python)** | Backend HTTP server, API routes, AI orchestration, and central event coordination | 
| **Socket.IO / WebSockets** | Persistent real-time connection for telemetry and live UI updates | 
| **Redis** | Fast temporary state and high-frequency telemetry aggregation | 
| **Supabase** | Persistent PostgreSQL-backed storage for lectures, analytics, chat logs, and summaries | 
| **REST APIs** | Request/response operations, including larger file uploads such as handwritten notes | 
| **LLM** | Private question answering and lecture-context triage; provider/model not specified | 

### 3.1 High-level data flow

**Cognitive telemetry**
`Student UI → Socket.IO / backend → Redis aggregation → rolling average → professor UI`

The source also specifies a REST endpoint, `POST /api/telemetry/friction`, for submitting a cognitive score. The exact division of responsibility between this REST route and the WebSocket `cognitive_update` event is not fully explained. Do not assume they are interchangeable without confirming the intended integration.

**Student question**
`Student UI → POST /api/qa/ask → asynchronous AI triage worker + transcript buffer → AI response`

If unresolved:
`AI triage → escalation → professor Q&A queue → Socket.IO qna_queue_update → professor UI`

**Handwritten notes / visual processing**
`Student upload → POST /api/notes/upload → note/visual processing → visual frame update → student UI`

The detailed image-processing implementation and exact `coordinates` response structure are not specified.

**Post-lecture summary**
`Lecture transcript + generated visuals + comprehension data → summary generation → Supabase summaries table → GET summary endpoint → client`

The exact summary-generation trigger and implementation are not specified.

### 3.2 Redis and telemetry

* Redis is intended for temporary, high-frequency state.

* The backend calculates a rolling class confusion average approximately every two seconds.

* The persistent `analytics` table stores aggregated values, not necessarily every raw student score.

* The precise rolling-window length, expiration policy, treatment of missing students, and aggregation formula are not specified.

### 3.3 Supabase

Supabase is the persistent data store for:

* Lectures

* Aggregated analytics

* Q&A/chat logs

* Post-lecture summaries and generated artifacts

Use the schema in Section 7 as the documented baseline.

## 4. Repository and Frontend Organization

The supplied project notes prescribe the following frontend organization. Treat this as the intended structure; verify the actual repository before creating, moving, or renaming files.

```
src/
├── api/
│   └── socket.js
├── components/
│   ├── Slider.jsx
│   ├── QuestionCard.jsx
│   └── VisualCanvas.jsx
├── contexts/
│   └── LectureContext.jsx
├── hooks/
│   └── useSocket.js
├── mock/
└── pages/
    ├── StudentView.jsx
    └── ProfessorView.jsx

```

### 4.1 Network layer: `src/api/socket.js`

* Centralize Socket.IO connection and event helpers here.

* Configure the socket with `autoConnect: false`.

* Export helper methods such as:

  * `emitCognitiveUpdate`

  * `subscribeToConfusion`

* UI components should not make raw socket calls directly.

### 4.2 Global state: `src/contexts/LectureContext.jsx`

The notes identify these application state values:

* `rollingAverage`

* `isQnaOpen`

* `questions`

* `visualStream`

Provide fallback initial state using fixtures from `src/mock/` so the frontend can be developed and tested before backend integration.

### 4.3 Socket hook: `src/hooks/useSocket.js`

* Encapsulate socket subscriptions and event handling.

* Bind UI triggers, such as slider release, to the backend's real-time events through the context/network layer.

* Replace mock handlers with real event handling only after the backend contract has been validated.

### 4.4 Presentation components

Components should be isolated presentation components. They receive data and callbacks through React props and should not contain network logic.

**`Slider.jsx`**

* Receives `min`, `max`, and `onRelease` props.

* The notes specifically mention native `onMouseUp` and `onTouchEnd` events.

* The cognitive score range is 1–10.

* The documented intent is to send an update when the student releases the slider, rather than continuously submitting every movement.

**`QuestionCard.jsx`**

* Receives `question`, `aiAnswer`, and `status` props.

* Displays private AI resolutions and escalated status/tags.

**`VisualCanvas.jsx`**

* Responsible for rendering incoming 2D/3D math matrices, graphs, or related visual frames.

* Must not own upload logic.

### 4.5 Page layouts

**`StudentView.jsx`**

* Composes the student-facing interface.

* Uses presentation components and handlers supplied by context.

* During initial development, mock handlers should log payload objects that match the shared API contract.

**`ProfessorView.jsx`**

* Composes the professor-facing interface.

* Includes a confusion heatmap, slide-out question-triage side panel, and global "Open Q&A" toggle.

* Can initially use mock state and fixtures.

### 4.6 Frontend environment variables

The notes specify:

* `VITE_BACKEND_URL`

* `VITE_WS_URL`

Use environment variables rather than hardcoding backend URLs or ports.

## 5. API Contract — REST Endpoints

The following endpoints are explicitly present in the supplied project notes. Request and response fields are reproduced from that contract. Where a detail is absent or ambiguous, it is marked as unspecified rather than guessed.

### 5.1 `POST /api/notes/upload`

**Purpose:** Upload handwritten math notes for processing.
**Request content type:** `multipart/form-data`

| Field | Type / constraint | Required status | 
| ----- | ----- | ----- | 
| `file` | PNG or JPEG image (`image/png` or `image/jpeg`) | Implied required | 
| `lectureId` | String | Implied required | 

**Documented response shape:**

```
{
  "success": true,
  "visualId": "UUID",
  "coordinates": {}
}

```

* `coordinates` is shown as an object placeholder (`{ ... }`); its internal schema is not specified.

* The source does not define maximum file size, upload limits, authentication, storage location, processing status, or error responses.

### 5.2 `POST /api/qa/ask`

**Purpose:** Submit a student question for AI triage.
**Request content type:** `application/json`

```
{
  "lectureId": "string",
  "studentId": "string",
  "question": "string"
}

```

The shared payload notes specify that `question` has a maximum length of 500 characters.

**Documented response shape:**

```
{
  "questionId": "UUID",
  "aiAnswer": "string",
  "quote": "string",
  "resolved": true
}

```

The separate AI-response payload definition allows `quote` to be `string | null`. Prefer nullable handling in clients unless the backend team confirms otherwise.

### 5.3 `POST /api/qa/escalate`

**Purpose:** Forward an unresolved question to the professor-facing Q&A queue.
**Request content type:** `application/json`

```
{
  "lectureId": "string",
  "questionId": "string",
  "studentId": "string",
  "question": "string"
}

```

**Documented response:**

```
{
  "success": true,
  "status": "escalated"
}

```

The response status is the literal string `"escalated"`.

### 5.4 `GET /api/lecture/:id/summary`

**Purpose:** Retrieve the post-lecture summary for a lecture.
**Path parameter:**

* `id`: lecture UUID

**Documented response shape:**

```
{
  "lectureId": "UUID",
  "notesMarkdown": "string",
  "keyTakeaways": ["string"],
  "generatedVisuals": [{}]
}

```

### 5.5 `GET /api/telemetry/heatmap/:lectureId`

**Purpose:** Retrieve aggregated comprehension/confusion telemetry for a lecture.
**Path parameter:**

* `lectureId`: lecture identifier

**Documented response example:**

```
{
  "rollingAverage": 0.70,
  "sampleCount": 42,
  "timestamp": "2026-11-07T14:30:00Z"
}

```

**Important schema discrepancy:** The analytics database comment says `rolling_average` ranges from `0.00` to `10.00`, consistent with a 1–10 student score. The API example uses `0.70`. Do not normalize or reinterpret this value without confirming whether the API returns a 0–1 normalized value or whether the example is inconsistent.

### 5.6 `POST /api/telemetry/friction`

**Purpose:** Submit a student's cognitive/confusion score.
**Request content type:** `application/json`

```
{
  "lectureId": "123e4567-e89b-12d3-a456-426614174000",
  "studentId": "student_01",
  "score": 7
}

```

**Field constraints from the shared payload contract:**

* `lectureId`: UUID string

* `studentId`: string

* `score`: integer, strictly from 1 to 10

**Documented response:** Not specified.

### 5.7 `POST /api/rehearsal/ping`

**Purpose:** End-to-end connectivity / demo health check.
**Request:**

```
{
  "message": "ping"
}

```

**Documented response:**

```
{
  "status": "ok",
  "message": "pong",
  "dbConnected": true
}

```

## 6. WebSocket / Socket.IO Contract

The source notes refer to a persistent Socket.IO connection and identify the following events. Preserve the event names exactly.

### 6.1 Client → Server: `toggle_qna`

**When:** Professor changes the dashboard Q&A switch.
**Payload:**

```
{
  "lectureId": "string",
  "isQnaOpen": true
}

```

### 6.2 Server → Client: `qna_state_change`

**When:** Server broadcasts the current Q&A state.
**Payload:**

```
{
  "isQnaOpen": true
}

```

### 6.3 Server → Client: `qna_queue_update`

**When:** Server broadcasts the escalated question list to the professor side panel.
**Payload:**

```
{
  "questions": [
    {
      "questionId": "string",
      "question": "string",
      "studentId": "string"
    }
  ]
}

```

### 6.4 Server → Client: `visual_frame_update`

**When:** Note parsing extracts 2D/3D math models.
**Payload:**

```
{
  "frameType": "matrix",
  "data": {}
}

```

The visualizer payload definition elsewhere in the source specifies:

* `lectureId`: UUID string

* `frameType`: one of `matrix`, `vector_space`, or `graph`

* `data`: object containing visualization data

Example visualizer payload:

```
{
  "lectureId": "UUID string",
  "frameType": "matrix",
  "data": {
    "matrix": [[1, 2], [3, 4]],
    "coordinates": [
      {"x": 1.0, "y": 2.5, "z": 0.0}
    ],
    "label": "Eigenvector transformation"
  }
}

```

### 6.5 `cognitive_update` — referenced, payload defined separately

The backend setup notes say the Socket.IO server should listen for the agreed-upon `cognitive_update` payload. The event is not included in the later event table, but a student-to-professor cognitive payload is documented:

```
{
  "lectureId": "UUID string",
  "studentId": "string",
  "score": 8
}

```

Constraints:

* `score` is an integer from 1 to 10.

* The notes describe Redis aggregation and rolling-average updates every two seconds.

**Contract status:** The payload is documented, but the exact server/client direction, acknowledgement, broadcast event name for updated confusion telemetry, and whether this event replaces or complements `POST /api/telemetry/friction` are not specified. Confirm these details with the backend owner before implementing against assumptions.

## 7. Supabase Database Schema

The supplied SQL schema defines four tables.

### 7.1 `lectures`

Stores active and historical lectures.

```
CREATE TABLE lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

```

### 7.2 `analytics`

Stores aggregated cognitive telemetry, documented as being recorded at a two-second interval.

```
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    rolling_average NUMERIC(4, 2) NOT NULL,
    sample_count INT NOT NULL
);

```

The source SQL comment describes `rolling_average` as having a range of `0.00` to `10.00`.

### 7.3 `chat_logs`

Stores student questions, AI answers, supporting quotes, and escalation status.

```
CREATE TABLE chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    question TEXT NOT NULL,
    ai_answer TEXT,
    quote TEXT,
    is_escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

### 7.4 `summaries`

Stores generated post-lecture notes and artifacts.

```
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    notes_markdown TEXT NOT NULL,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    generated_visuals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

### 7.5 Database implementation notes

* The foreign keys reference `lectures(id)` and specify `ON DELETE CASCADE`.

* The schema does not include authentication/user tables, lecture membership, raw individual telemetry, transcript storage, uploaded-file metadata, or a separate questions table.

* Do not assume row-level security policies, indexes, triggers, or Supabase Storage buckets exist; they are not included in the supplied schema.

* Confirm whether `lecture_id` should be `NOT NULL`; the supplied SQL does not declare it as such.

## 8. Shared JSON Payload Reference

This section consolidates the payload definitions for quick reference.

### 8.1 Cognitive telemetry: student → professor/backend

```
{
  "lectureId": "UUID string",
  "studentId": "string",
  "score": 8
}

```

`score` is an integer in the inclusive range 1–10.

### 8.2 Student question: student → AI

```
{
  "lectureId": "UUID string",
  "studentId": "string",
  "question": "string (max 500 chars)"
}

```

### 8.3 AI response: AI → student

```
{
  "questionId": "UUID string",
  "aiAnswer": "string",
  "quote": "string | null",
  "resolved": true
}

```

### 8.4 Question escalation: AI → professor

```
{
  "lectureId": "UUID string",
  "questionId": "UUID string",
  "studentId": "string",
  "question": "string",
  "status": "escalated"
}

```

`status` is the literal string `"escalated"`.

### 8.5 Visualizer payload

```
{
  "lectureId": "UUID string",
  "frameType": "matrix | vector_space | graph",
  "data": {
    "matrix": [[1, 2], [3, 4]],
    "coordinates": [
      {"x": 1.0, "y": 2.5, "z": 0.0}
    ],
    "label": "Eigenvector transformation"
  }
}

```

## 9. Development and Integration Workflow

The project notes prescribe a coordinated, contract-first workflow.

### 9.1 Agree on the universal data shape

Before parallel implementation:

* Define exact JSON request and response bodies.

* Define field types (for example, whether `score` is an integer).

* Ensure frontend, backend, and database use the same schemas.

* Record WebSocket event names and payloads in a shared API contract.

### 9.2 Shared repository and environment

* Use one shared GitHub repository.

* Include a `.env.example`.

* Document shared port numbers and required environment variables.

* Use dummy/example credentials only in `.env.example`; never commit real secrets.

### 9.3 Early end-to-end rehearsal

The notes call for a "Hello World" payload to travel end-to-end by approximately hour two:
`Frontend → FastAPI → Supabase → Frontend`
A rehearsal endpoint is also documented as `POST /api/rehearsal/ping`.

### 9.4 Backend workstream

1. Implement REST routes for file uploads, including `POST /api/notes/upload`.

2. Buffer incoming lecture transcript chunks asynchronously in memory.

3. Implement an AI triage worker that queries an LLM using buffered transcript context.

4. Keep LLM work asynchronous so socket handling is not blocked.

5. Expose escalation functionality for unresolved questions.

6. Initialize FastAPI with `CORSMiddleware`.

7. Configure Socket.IO and the agreed `cognitive_update` payload.

8. Connect Redis and calculate rolling confusion averages every two seconds.

9. Provide a mock loop that emits fake slider data through the WebSocket channel for demo reliability.

### 9.5 Frontend workstream

 1. Scaffold the agreed directory structure.

 2. Configure `VITE_BACKEND_URL` and `VITE_WS_URL`.

 3. Build the network layer before wiring UI components.

 4. Keep raw socket calls out of presentation components.

 5. Build `LectureContext.jsx` with mock fallback state.

 6. Build isolated presentation components.

 7. Assemble student and professor layouts.

 8. Test responsive behavior and conditional rendering using mock fixtures.

 9. Replace mock socket handlers with real event subscriptions.

10. Complete an end-to-end handshake after backend routes pass Postman tests.

### 9.6 Database and integration workstream

1. Create the Supabase tables using the finalized shared schemas.

2. Build a Postman collection to test backend routes as soon as they are available.

3. Implement backend-to-Supabase insertion logic and check column/type compatibility.

4. Replace frontend mock data with real API calls after the backend routes pass validation.

## 10. Testing and Demo Expectations

### 10.1 API testing

Use Postman to validate:

* Request methods and paths.

* Content types, required request fields, and field types.

* Response shapes.

* Supabase insertion compatibility.

### 10.2 Frontend testing before backend completion

Use mock fixtures in `src/mock/` to test layout, rendering, sliders, queues, and visual frame display while backend routes are in development.

### 10.3 End-to-end checks

Validate connectivity across the stack (frontend → FastAPI → Supabase → frontend), as well as WebSocket telemetry aggregation, Q&A state broadcasting, and visual frame delivery.

## 11. Configuration and Environment

The frontend variables explicitly named in the source are:

```
VITE_BACKEND_URL=
VITE_WS_URL=

```

**Not specified in the source:**

* Backend/Frontend ports

* Redis URL/credentials

* Supabase URL and keys

* LLM provider/API key

* CORS allowlist

Never fabricate secrets or put credentials in source control.

## 12. Known Gaps, Ambiguities, and Contract Risks

Ask for clarification or inspect the implementation before making assumptions:

 1. **Cognitive telemetry transport:** Both a Socket.IO `cognitive_update` event and `POST /api/telemetry/friction` are described.

 2. **Telemetry scale:** Rolling average scale mismatch (0-10 vs 0.70 example).

 3. **Telemetry broadcast:** Missing server event for broadcasting updated rolling averages.

 4. **Anonymity vs. `studentId`:** Conflict between product description and payload schema.

 5. **AI response timing:** Missing details on whether `POST /api/qa/ask` is synchronous or asynchronous.

 6. **Transcript details:** Missing ingest mechanism and quote provenance.

 7. **Question upvoting:** Missing endpoint/schema.

 8. **Lecture lifecycle:** Missing create/start/end routes.

 9. **Visual payload / Upload:** Unspecified schemas and processing states.

10. **Auth & Security:** No authentication mechanism or RLS policies documented.

## 13. Instructions for AI Assistants Working on Axiom

1. **Treat this document as project context, not proof of the current codebase.** Inspect the repository first.

2. **Preserve existing contracts.** Do not rename endpoints, events, or database columns silently.

3. **Do not invent missing implementation details.** Use Section 12 to identify gaps.

4. **Separate facts from proposals.** Label recommendations clearly.

5. **Keep frontend presentation components network-agnostic.**

6. **Keep long-running AI work asynchronous.**

7. **Use environment variables for service URLs and credentials.**

## 14. Quick Reference

| Concern | Documented value | 
| ----- | ----- | 
| **Project** | Axiom | 
| **Frontend / Backend** | React / FastAPI (Python) | 
| **Real-time / Aggregation** | Socket.IO / Redis | 
| **Database** | Supabase | 
| **Cognitive score** | Integer, 1–10 | 
| **Max question length** | 500 characters | 
| **Visual frame types** | `matrix`, `vector_space`, `graph` | 

### REST Route Index

| Method | Path | Purpose | 
| ----- | ----- | ----- | 
| POST | `/api/notes/upload` | Upload handwritten notes | 
| POST | `/api/qa/ask` | Submit question for AI triage | 
| POST | `/api/qa/escalate` | Escalate unresolved question | 
| GET | `/api/lecture/:id/summary` | Retrieve lecture summary | 
| GET | `/api/telemetry/heatmap/:lectureId` | Retrieve aggregated telemetry | 
| POST | `/api/telemetry/friction` | Submit cognitive score | 
| POST | `/api/rehearsal/ping` | Connectivity rehearsal | 

### Socket Event Index

| Direction | Event | Purpose | 
| ----- | ----- | ----- | 
| Client → Server | `toggle_qna` | Professor toggles Q&A | 
| Server → Client | `qna_state_change` | Broadcast Q&A state | 
| Server → Client | `qna_queue_update` | Update professor escalation queue | 
| Server → Client | `visual_frame_update` | Deliver generated visual frame | 
| TBD | `cognitive_update` | Cognitive telemetry update | 

## 15. Source and Scope Note

This document is a structured consolidation of the supplied **"Hackathons \_3 - Google Docs.pdf"** project notes. It preserves the project's named technologies, feature descriptions, folder suggestions, database SQL, payload examples, REST routes, and Socket.IO event names.

This is a **project-context handoff**, not a claim that every endpoint, table, component, or event has already been implemented or verified in a live repository.
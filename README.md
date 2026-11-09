# Axiom

Real-time lecture intelligence copilot turning silent lecture halls into adaptive learning environments via live cognitive telemetry, instant transcript-cited AI doubt triage, and dynamic 2D/3D math visualizations.



## 🛑 The Fear Behind The Fails: Problem Definition & Context
**72% of university students** experience debilitating anxiety when asking questions during live lectures, while **61% of professors** wait until final exam grading to identify conceptual bottlenecks

This silence leaves educators teaching completely blind to where comprehension breaks down. When foundational concepts are missed early, misunderstandings compound rapidly as technical course material advances

Traditional feedback channels like office hours or post-lecture emails remain delayed, reactive, and rarely used by the students who struggle most By the time exam scores reveal these deficits, the critical window for academic intervention has already closed

## 💡 Fixing The Foundations: Axiom & Inclusive Solution
Axiom replaces post-lecture blind spots with immediate, real-time intervention, serving as an adaptive AI teaching assistant across the lecture hall By tapping into live lecture feeds, Axiom resolves student doubts dynamically as they emerge

The platform decodes friction using live transcript-cited explanations and multi-dimensional visual math renderings—keeping learners unstuck without disrupting the speaker or isolating students with accessibility needs
Concurrently, student confusion data is anonymized into a real-time cognitive telemetry stream, equipping professors with an ambient heatmap to spot comprehension bottlenecks instantly and adapt on the fly.

## ⚙️ The Mechanics: Technical Architecture & AI Implementation
 **High-Frequency Redis Cache:** In-memory sliding-window cache rolling room-wide cognitive friction averages every two seconds without hitting persistent storage

 **Multimodal AI Triage & Visuals:** Live audio transcript buffering for instant, cited question answering paired with dynamic 2D/3D visual math rendering

**Real-Time WebSocket Layer:** Bidirectional WebSockets broadcasting live confusion heatmaps, synchronized visual frames, and Q&A state changes between student and professor views

**Permanent Supabase Persistence:** PostgreSQL tables securely persisting active lecture sessions, historical telemetry logs, chat logs, and automated post-lecture summaries

## 🚧 Challenges We Ran Into: Engineering & Feasibility
1. **API & Data Alignment:** Locked strict data shapes and contracts early to keep the frontend, backend, and Supabase layers completely synchronized.

2.  **High-Volume Telemetry Ingestion:** Engineered a Redis rolling-window cache to aggregate real-time slider releases without degrading database performance.
3.  **AI Latency Under Concurrency:** Decoupled transcript buffering and multimodal math parsing into background workers so live socket threads never froze.
4. **Live Stream Feed Constraints:** Pivoted from complex custom video streaming to a synchronized embedded broadcast stream to stay reliable during the 12-hour limit.

## 🚀 Up Next For Axiom: Educational Impact & Scaling
**Automated Post-Lecture Analytics:** Generate comprehensive comprehension audits highlighting specific timestamps and concepts where friction peaked.

 **Curated Student Retrospectives:** Auto-compile session transcripts, resolved student doubts, and dynamic visual canvas artifacts into structured study digests.

 **Adaptive Practice Generation:** Ingest course syllabi and lecture slides to auto-generate targeted problem sets directly addressing individual and class-wide weak points.

 **Localized Model Inference:** Deploy distilled, on-device ML pipelines to drastically lower inference latency and cloud compute costs for institutional scale.

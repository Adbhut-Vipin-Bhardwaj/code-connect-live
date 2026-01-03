# Plan to Move to CRDT-Based Collaboration

## 1) Current Problem
- Whole-document, versioned PUTs with 409 conflict fallback and 1s SSE polling cause cursor jumps and lost intent during simultaneous edits.
- Cursors are tracked by absolute offsets and patched via polling, so remote inserts/deletes shift local selections unexpectedly.
- Echo suppression is client-side only; no true concurrent merge or offline tolerance.

## 2) High-Level Solution (Yjs CRDT + WebSocket)
- Adopt Yjs text CRDT for the shared document; represent code as a `Y.Text` per session.
- Use awareness metadata for cursors/selection/presence, rebased on the same CRDT ops so cursors stay stable.
- Replace poll-based SSE with a WebSocket provider; broadcast CRDT updates (deltas) and awareness messages in near-real time.
- Persist periodic snapshots + oplog for fast joins and recovery; keep current REST APIs for session creation/metadata.

## 3) Migration Approach for This Codebase

### Backend (FastAPI)
- Add a WebSocket endpoint per session (e.g., `/v1/sessions/{id}/sync`) that relays Yjs update messages and awareness updates.
- Maintain an in-memory Yjs doc map keyed by session id; persist snapshots to storage (initially disk/Redis, later DB) on interval and on shutdown.
- On connect: load snapshot (or create new), send state vector + updates, and register the client; on update: broadcast to other peers and append to oplog; on disconnect: release resources.
- Keep existing REST endpoints for session CRUD and language changes; when language changes, reset/annotate the CRDT doc with template code and bump metadata.

### Frontend (React + Monaco)
- Add CRDT deps: `yjs`, `y-websocket` (or custom provider to our WS), and `monaco-yjs` binding.
- In `InterviewRoom`, initialize a Yjs doc, connect provider to the new WS endpoint, bind `Y.Text` to Monaco via `monaco-yjs`, and remove debounce/PUT logic.
- Move cursor/selection sharing to Yjs awareness instead of REST `PATCH` + SSE; render remote cursors from awareness state.
- Keep REST calls for session metadata (title/language) and participant join/leave; wire language changes to replace CRDT text content.

### Data Model and Interop
- Session metadata (`language`, `title`, etc.) stays in existing REST models; CRDT holds `code` only.
- On initial load: fetch session metadata via REST, then attach to WS/CRDT to load the live text.
- Awareness payload shape: `{ participantId, name, color, cursor: { line, column, anchor, head } }`.

### Persistence and Compaction
- Snapshot each session doc every N seconds or after M updates; truncate oplog beyond last snapshot to bound memory.
- On startup, load latest snapshot if present; otherwise seed from `DEFAULT_CODE`.

### Rollout Steps
- Phase 1: Introduce backend WS relay + Yjs doc store; gate via feature flag/env.
- Phase 2: Frontend integrates provider + Monaco binding behind flag; fall back to current REST/SSE when disabled.
- Phase 3: Enable for dogfood sessions; measure correctness/latency and tune snapshot cadence.
- Phase 4: Remove legacy versioned PUT/SSE code paths once stable and clients are migrated.

## 4) Risks and Mitigations
- **State loss on server restart:** mitigate with periodic snapshots + oplog persistence.
- **Hot session fan-out load:** use Redis/NATS pub/sub for multi-instance broadcast when scaling horizontally.
- **Mixed-client compatibility:** keep dual paths during rollout; negotiate protocol via feature flag or server capability response.
- **Security:** authenticate WS connections (token tied to session) and rate-limit awareness updates.

## 5) Next Actions
1) Choose provider strategy: reuse `y-websocket` protocol or implement minimal compatible relay in FastAPI.
2) Add backend WebSocket route and in-memory Yjs doc manager with snapshot hooks.
3) Add frontend CRDT deps and wire `InterviewRoom`/`CodeEditor` to `monaco-yjs` + awareness.
4) Implement snapshot storage (disk/Redis) and cleanup for stale sessions.
5) Run pairing tests with two browsers to verify cursor stability and conflict-free merges.

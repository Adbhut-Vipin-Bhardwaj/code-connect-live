# Live Collaboration Fix Plan

## Problem
- No per-user cursors or typing state are propagated; clients don’t send or render peer cursor data.
- Code sync is last-write-wins, so concurrent edits clobber each other and feel like “other window affects mine.”
- Participant streaming is slow/polling, so presence/cursor updates are laggy.

## Goals
- Separate, visible cursors per user and stable participant presence.
- Prevent one user’s edits from overwriting another’s (reduce echo/last-write issues).
- Improve real-time propagation (participants + code) to be event-driven and resilient.

## Step-by-Step Plan

1) **Persist local participant identity**
   - Store the `joinSession` response (id, name, color) in sessionStorage alongside the generated name.
   - Expose the current participant id/name to the editor layer so we can filter self updates and label cursors.

2) **API client: add participant updates**
   - Add `updateParticipant(sessionId, participantId, payload)` in `frontend/src/services/api.ts` that PATCHes cursor, `isTyping`, `isOnline`.
   - Add lightweight error handling/backoff for transient failures.

3) **Frontend wiring for cursors/typing**
   - In `InterviewRoom`, keep `currentParticipant` state from `joinSession` and pass it to `CodeEditor`.
   - In `CodeEditor`, hook Monaco events:
     - `onDidChangeCursorPosition` → throttle to ~100–150ms → send `{cursor: {lineNumber, column}}` via `updateParticipant`.
     - `onDidChangeModelContent` → debounce typing flag (set `isTyping` true on change, auto-clear after ~1s idle, include in PATCH).
   - Filter out the local participant when building `remoteCursors` to avoid rendering your own cursor twice.

4) **Participants stream improvements**
   - Backend: emit participant updates immediately instead of 2s polling (switch SSE generator to await a notifier or move to websocket). For quick win, keep SSE but push on mutation events via an asyncio Queue/condition.
   - Frontend: keep existing `subscribeToParticipants` but expect higher-frequency updates; ensure cleanup on unmount.

5) **Code stream conflict mitigation (interim)**
   - Tag outbound code updates with `participantId` and include a monotonically increasing `version` (or timestamp) in the payload.
   - Backend: store and stream `{code, language, version, lastUpdatedBy}`; reject/stash stale versions.
   - Frontend: when receiving SSE, ignore payloads authored by self if version ≤ locally applied version; update local code only when remote version is newer.

6) **Longer-term correctness (optional but recommended)**
   - Replace ad-hoc PUT + SSE with CRDT/OT (e.g., Yjs + y-monaco + y-websocket) to eliminate race conditions and achieve true multi-user merge.

7) **Presence lifecycle**
   - Mark `isOnline` false on tab close/visibility loss (beforeunload/visibilitychange) via `updateParticipant`.
   - Optionally add heartbeats to keep presence fresh.

8) **Testing & verification**
   - Add unit tests for `updateParticipant` client helper.
   - Add frontend integration test (playwright/vitest + jsdom) to ensure cursor PATCH is called on move and self cursor is filtered.
   - Manual: two-browser smoke test for cursors, typing indicator, and code edits not overwriting each other under rapid typing.

## Suggested implementation order
1. Client identity + `updateParticipant` API helper.
2. Hook cursor/typing events in `CodeEditor` and pass current participant.
3. Participant stream push-based improvements.
4. Versioned code updates to reduce overwrites.
5. Optional CRDT swap if time permits.

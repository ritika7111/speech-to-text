# Azure STT — Project Overview

## Code Structure

- `app/page.tsx` — Upload UI, paginated table, view-more popover. Fetches `/api/azure-stt`.
- `app/api/azure-stt/route.ts` — Handles uploads (POST) to Azure STT, normalizes response, persists to MongoDB; lists recent transcriptions (GET) with pagination.
- `models/AzureTranscription.ts` — Mongoose schema and model for Azure transcriptions.
- `lib/mongodb.ts` — Connection helper with simple global cache.
- `app/transcriptions/page.tsx` — Legacy demo page for simple mock transcription flow.

Key flows:
- Upload audio in `app/page.tsx` → `POST /api/azure-stt` → Azure STT → `AzureTranscription.create(...)` → returns normalized `{ DisplayText, id }` → UI refreshes `GET /api/azure-stt?page=…`.
- Listing uses server-side pagination and shows last 30 days by default.

## Assumptions

- Audio uploads are small and directly posted as binary buffers; no object storage integration yet.
- Azure STT accepts the client-provided `Content-Type` and codec (e.g., `audio/webm; codecs=opus`) without server-side transcoding.
- Environment variables exist: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `MONGODB_URI`.
- Basic auth/roles are out of scope; routes are publicly callable in dev.
- Network latency and Azure response shape may vary; the API normalizes `DisplayText` from `NBest` when needed.

## Production Improvements

- Input validation
  - Enforce allowed mime types and max size on upload.
  - Verify audio duration to avoid empty/silent clips.
- Storage and processing
  - Upload audio to durable storage (S3/Azure Blob), persist URL; avoid keeping raw buffers in requests.
  - Optional server-side transcoding to `wav` (16kHz PCM) when input codecs are unsupported.
- Reliability
  - Retries with circuit breaking and structured error responses.
  - Queue-based processing for long files (e.g., using a job worker).
- Security
  - Protect API routes with auth and rate limits.
  - Validate env presence at startup; fail fast with clear logs.
- Observability
  - Structured logs with correlation IDs, request metrics, Azure latency, and error codes.
  - Add tracing (OpenTelemetry) and per-request diagnostics.
- UX
  - Sticky table header, column sorting, adjustable page size, and export.

## MongoDB Indexing Notes

- Suggested indexes for `AzureTranscription`:
  - `{ createdAt: -1 }` — supports recent-first pagination.
  - `{ audioUrl: 1 }` — faster lookup by source file name.
  - Compound when needed: `{ language: 1, createdAt: -1 }` if filtering by language is common.
- TTL considerations
  - If historical retention is limited, consider a TTL index using a date field to auto-expire documents.
- Pagination
  - Use `createdAt` + `_id` for cursor-based pagination at scale to avoid skip/limit costs.

## Scalability Notes

- Throughput
  - Offload long transcriptions to background jobs; respond with a task ID and poll for completion.
  - Batch listing endpoints with cursor pagination for large datasets.
- Azure STT usage
  - Cache or deduplicate uploads by content hash to avoid repeated processing.
- System design
  - Separate API for ingestion vs. querying; shard read services separately from write-heavy workflows.
  - Introduce a message queue (e.g., SQS/Service Bus) and worker pool for audio processing.
  - Add rate limiting and back-pressure on uploads to protect Azure limits.

## Getting Started

```bash
npm run dev
```

Open `http://localhost:3000` and use the Upload panel. Configure `.env`:

```
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...
MONGODB_URI=mongodb+srv://...
```

Use `GET /api/azure-stt?page=1&limit=5` to list recent transcriptions.

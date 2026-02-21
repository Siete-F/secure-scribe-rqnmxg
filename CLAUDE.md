# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Safe Transcript is a privacy-focused audio transcription app built with React Native (Expo). It records audio, transcribes it via Mistral Voxtral, anonymizes PII, and processes cleaned transcripts with a configurable LLM. The app is fully local — on iOS/Android, projects and recordings are stored as plain files (markdown, text, JSON) in a configurable folder structure; on web, data is stored in SQLite (sql.js). API keys and app settings remain in SQLite on all platforms. External API calls (transcription, LLM) are made directly from the device using user-provided API keys.

## Commands

### Frontend (repo root)
- `npm run dev` — Start Expo dev server with tunnel
- `npm run web` — Web-only dev server
- `npm run lint` — ESLint
- `npm run build:web` — Export web build
- `npx eas-cli build -p android --profile preview` — Build Android APK

### Environment Setup
- No backend server needed — app is fully local
- API keys (OpenAI, Gemini, Mistral) are entered in the Settings screen and stored in the local SQLite database

## Architecture

**Frontend:** React Native 0.81 + Expo SDK 54 + Expo Router (file-based routing) + React 19
- Screens in `app/` with tab navigation in `app/(tabs)/`
- `@/` path alias for imports from the frontend root
- No authentication — single-user local app
- On-device transcription via `react-native-executorch` managed by `services/LocalModelManager.ts` and `hooks/useHybridTranscribe.ts`

**Storage (iOS/Android) — file-based:**
- Projects and recordings stored as plain files in a configurable folder structure
- `services/fileStorage.ts` — core file I/O service (read/write JSON, text, audio)
- `db/operations/projects.ts` — project CRUD via folder + `config.json`
- `db/operations/recordings.ts` — recording CRUD via timestamp-named files
- Project ID = folder slug (e.g. `my-project`); Recording ID = `"{folder}::{timestamp}"`
- Storage root configurable via `settings` table in SQLite, default: `documentDirectory/SafeTranscript/`

**Storage (Web) — SQLite:**
- Web builds use `.web.ts` platform files that preserve the original SQLite-based operations
- `db/operations/projects.web.ts`, `db/operations/recordings.web.ts` — SQLite CRUD via sql.js
- `services/fileStorage.web.ts` — stub (web has no real filesystem)

**Database (all platforms):** SQLite via `expo-sqlite` + Drizzle ORM
- Schema in `db/schema.ts` — tables: `projects`, `recordings` (web only), `api_keys`, `settings`
- `settings` table stores key/value pairs (e.g. `storage_root`)
- `api_keys` table stores LLM API keys (kept in SQLite for privacy)
- Database client in `db/client.ts` (native) / `db/client.web.ts` (web)

**Services (run on-device):**
- `services/transcription.ts` — Mistral Voxtral API via raw fetch with multipart form data
- `services/anonymization.ts` — Regex-based PII detection and masking
- `services/llm.ts` — Raw fetch to OpenAI/Gemini/Mistral REST APIs
- `services/audioStorage.ts` — Audio file management (delegates to fileStorage on native)
- `services/processing.ts` — Processing pipeline: transcribe → anonymize → LLM process
- `services/fileStorage.ts` — File-based project/recording storage (native only)

**Processing Pipeline:** Audio → Voxtral Transcribe v2 (API or local Mini 4B on mobile) → PII Anonymization (regex-based) → LLM Analysis (OpenAI/Gemini/Mistral)

## Key Constraints

- **Do NOT add DOM-only npm packages** (leaflet, react-leaflet, react-router-dom) — they conflict with React Native and/or React 19. Use CDN resources via WebView/iframe instead.
- **Do NOT use `--force` or `--legacy-peer-deps`** with npm install. Resolve peer conflicts by finding compatible versions.
- **expo-router is the sole router** — do not add `react-router-dom` or standalone `@react-navigation/*` navigators.
- **New Architecture is required** (`newArchEnabled: true` in app.json) for ExecuTorch. Expo Go does not work — use Development Builds (`npx expo run:ios` / `run:android`).
- **DB inserts must provide explicit values** for UUID/timestamp fields. Serialize Date objects to ISO strings. Don't include `null` values for optional fields — omit them instead.
- **Platform-specific files** use Metro's `.web.ts` convention. `projects.ts`/`recordings.ts` are file-based (native); `projects.web.ts`/`recordings.web.ts` are SQLite-based (web).
- **Recording IDs on native** are composite: `"{projectFolder}::{timestamp}"`. Parse with `parseRecordingId()` from `services/fileStorage.ts`.
- `cross-env` is required in npm scripts for Windows compatibility.
- Maps use WebView + Leaflet CDN on native, iframe + Leaflet CDN on web (no npm map packages).
- **LLM/transcription SDKs**: Use raw `fetch` calls to provider REST APIs instead of Node.js SDKs for React Native compatibility.

## LLM Providers

Configured per-project. Supported: OpenAI (gpt-4, gpt-4-turbo, gpt-3.5-turbo), Google Gemini (gemini-2.0-flash, gemini-1.5-pro/flash), Mistral (mistral-large/medium/small-latest). User API keys stored in the local `api_keys` table, managed via the Settings screen.

## Data Storage

**Native (iOS/Android) — folder structure:**
```
{storageRoot}/                            ← configurable, default: documentDirectory/SafeTranscript/
  {project-slug}/
    config.json                           ← project settings (LLM config, custom fields, etc.)
    recordings/
      {timestamp}.json                    ← recording metadata (status, duration, PII mappings)
      {timestamp}.m4a                     ← audio file
    transcriptions/
      {timestamp}.txt                     ← raw transcription (plain text)
      {timestamp}.segments.json           ← transcription segments with timestamps
      {timestamp}.anonymized.txt          ← anonymized transcription
    llm_responses/
      {timestamp}.md                      ← LLM output (markdown)
```

**Web — SQLite (sql.js):** Full SQLite tables for `projects` and `recordings` (same schema as before the file-based migration), persisted to localStorage.

**All platforms — SQLite:** `api_keys` (single-row, LLM API keys), `settings` (key/value, e.g. `storage_root`). Tables created on first launch via `initializeDatabase()` in `db/client.ts`.

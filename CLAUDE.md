# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Safe Transcript is a privacy-focused audio transcription app built with React Native (Expo). It records audio, transcribes it via Mistral Voxtral, anonymizes PII, and processes cleaned transcripts with a configurable LLM. The app is fully local — all data is stored on-device in SQLite, audio files are saved to local filesystem, and external API calls (transcription, LLM) are made directly from the device using user-provided API keys.

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

**Database:** SQLite via `expo-sqlite` + Drizzle ORM (`drizzle-orm/expo-sqlite`)
- Schema in `db/schema.ts` — three tables: `projects`, `recordings`, `apiKeys`
- Database client in `db/client.ts` — initializes on app launch
- CRUD operations in `db/operations/` (projects, recordings, apikeys, export)
- JSON fields stored as TEXT with JSON.stringify/parse in the operations layer
- Timestamps stored as ISO strings, UUIDs as TEXT

**Services (run on-device):**
- `services/transcription.ts` — Mistral Voxtral API via raw fetch with multipart form data
- `services/anonymization.ts` — Regex-based PII detection and masking
- `services/llm.ts` — Raw fetch to OpenAI/Gemini/Mistral REST APIs
- `services/audioStorage.ts` — Local audio file management via expo-file-system
- `services/processing.ts` — Processing pipeline: transcribe → anonymize → LLM process

**Processing Pipeline:** Audio → Voxtral Transcribe v2 (API or local Mini 4B on mobile) → PII Anonymization (regex-based) → LLM Analysis (OpenAI/Gemini/Mistral)

## Key Constraints

- **Do NOT add DOM-only npm packages** (leaflet, react-leaflet, react-router-dom) — they conflict with React Native and/or React 19. Use CDN resources via WebView/iframe instead.
- **Do NOT use `--force` or `--legacy-peer-deps`** with npm install. Resolve peer conflicts by finding compatible versions.
- **expo-router is the sole router** — do not add `react-router-dom` or standalone `@react-navigation/*` navigators.
- **New Architecture is required** (`newArchEnabled: true` in app.json) for ExecuTorch. Expo Go does not work — use Development Builds (`npx expo run:ios` / `run:android`).
- **DB inserts must provide explicit values** for UUID/timestamp fields. Serialize Date objects to ISO strings. Don't include `null` values for optional fields — omit them instead.
- `cross-env` is required in npm scripts for Windows compatibility.
- Maps use WebView + Leaflet CDN on native, iframe + Leaflet CDN on web (no npm map packages).
- **LLM/transcription SDKs**: Use raw `fetch` calls to provider REST APIs instead of Node.js SDKs for React Native compatibility.

## LLM Providers

Configured per-project. Supported: OpenAI (gpt-4, gpt-4-turbo, gpt-3.5-turbo), Google Gemini (gemini-2.0-flash, gemini-1.5-pro/flash), Mistral (mistral-large/medium/small-latest). User API keys stored in the local `api_keys` table, managed via the Settings screen.

## Database

SQLite (expo-sqlite) with Drizzle ORM. Core tables: `projects` (with customFields and sensitiveWords as JSON text), `recordings` (status: pending→transcribing→anonymizing→processing→done/error, plus transcription/anonymization/LLM output fields, audioPath for local file), `api_keys` (single-row for LLM keys). Tables created on first launch via `initializeDatabase()` in `db/client.ts`.

# Smart Hostel Management

A full-stack hostel management dashboard with student, warden, and admin workflows.
The app includes a React/Vite frontend, an Express backend, a JSON-backed demo database, and AI-powered complaint/leave handling logic.

## Features

- User authentication for students, wardens, and admins
- Room management with allocation flows
- Complaint tracking and AI-assisted classification
- Leave requests, visitor passes, fee management, and notifications
- AI chatbot support for natural language requests
- Local JSON database with seeded demo users

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, tsx
- AI: Google Gemini (`@google/genai`) with fallback rules
- Data: `database.json` seeded local database

## Prerequisites

- Node.js 18+ installed
- npm available

## Setup

1. Clone or copy the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file at the project root and add:
   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
   If you do not have a Gemini API key, the app can still run using local AI fallback logic.

## Scripts

- `npm run dev` — start the development server (`tsx server.ts`) on `http://localhost:3000`
- `npm run build` — build frontend and bundle the backend server
- `npm start` — run the built server from `dist/server.cjs`
- `npm run clean` — remove build artifacts
- `npm run lint` — run TypeScript type check

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Demo Credentials

- Admin: `admin@hostel.com` / `admin`
- Warden: `warden@hostel.com` / `warden`
- Student: `student@hostel.com` / `student`

## Notes

- This project uses `database.json` as the demo data store.
- Authentication is simplified for demo purposes and stores passwords in plain text.
- The AI chat and complaint classification use the Gemini SDK if `GEMINI_API_KEY` is set.

## Project Structure

- `server.ts` — backend Express server and API routes
- `server/db.ts` — demo JSON database schema and persistence functions
- `server/gemini.ts` — AI intent processing and Gemini integration
- `src/` — React frontend pages, components, and app context
- `database.json` — seeded demo data store

## License

This repository is provided as-is for demo and prototyping purposes.

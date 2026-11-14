# Taskflow frontend

React/Vite frontend for the task manager backend on the `backend` branch.

## Run locally

Install Node.js 18+ and npm, then run:

```bash
npm install
npm run dev
```

The app expects the backend at `http://localhost:8080/api`. To use another
URL, set `VITE_API_URL` before starting Vite:

```bash
VITE_API_URL=http://localhost:8080/api npm run dev
```

The frontend uses the backend endpoints `GET/POST /api/tasks`,
`PUT/DELETE /api/tasks/{id}`, and `GET /api/health`.
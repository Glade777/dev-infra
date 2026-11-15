# Taskflow frontend

React/Vite frontend for the task manager backend on the `backend` branch.

## Run locally

Install Node.js 18+ and npm, then run:

```bash
npm install
npm run dev
```

In development, the app defaults to `/api`. To use a separately hosted
backend, set `VITE_API_URL` before starting Vite:

```bash
VITE_API_URL=http://localhost:8080/api npm run dev
```

The frontend uses the backend endpoints `GET/POST /api/tasks`,
`PUT/DELETE /api/tasks/{id}`, and `GET /api/health`.

## Deploy behind nginx

Build the frontend and copy the contents of `dist/` to the nginx web root:

```bash
npm ci
npm run build
```

Configure nginx to serve the single-page application and proxy `/api/` to
Tomcat. Replace the Tomcat host and port with the values for your server:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/taskflow;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

With this setup, the browser calls nginx at the same origin and nginx
forwards those requests to Tomcat, so browser CORS configuration is not
needed. If Tomcat is hosted under a different context path, adjust the
`proxy_pass` target accordingly.
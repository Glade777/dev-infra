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
Tomcat. If the WAR is deployed with its default name
`task-manager-1.0.war`, Tomcat's context path is `/task-manager-1.0`:

```nginx
server {
    listen 80;
    server_name 192.168.1.106 taskflow;
    root /var/www/taskflow;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/task-manager-1.0/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

The `server_name` must match the hostname or IP address used in the browser.
For example, with the configuration above, open the site at:

```text
http://192.168.1.106/
```

Do not use `/taskflow/` as a URL path unless the frontend is specifically
built and configured for that subpath. The frontend calls `/api/...` relative
to the site root.

Enable the site and reload nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/taskflow \
    /etc/nginx/sites-enabled/taskflow
sudo nginx -t
sudo systemctl reload nginx
```

If the default nginx site is still enabled and displays the nginx welcome
page, disable it and reload nginx:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Verify the API through nginx:

```bash
curl http://192.168.1.106/api/health
```

The frontend files copied to `/var/www/taskflow` should include `index.html`
and an `assets/` directory.

### Deploying the WAR as ROOT

Alternatively, deploy the backend WAR as `ROOT.war`. In that case, Tomcat's
context path is `/`, and use this proxy target instead:

```nginx
proxy_pass http://127.0.0.1:8080/api/;
```

With either setup, the browser calls nginx at the same origin and nginx
forwards those requests to Tomcat, so browser CORS configuration is not
needed. The backend must be running on Tomcat before nginx can proxy API
requests.

### Troubleshooting

Inspect the active nginx configuration if the expected server block is not
being used:

```bash
sudo nginx -T | grep -n "server_name\|root\|proxy_pass"
```

- The nginx welcome page usually means the site is not enabled or
  `server_name` does not match the hostname/IP in the browser.
- `502 Bad Gateway` usually means Tomcat is stopped or is not listening on
  port `8080`.
- A `404` from nginx at `/api/...` usually means `proxy_pass` is commented out
  or the Tomcat context path is incorrect.
- A `404` after refreshing a frontend URL usually means the
  `try_files ... /index.html` fallback is missing.
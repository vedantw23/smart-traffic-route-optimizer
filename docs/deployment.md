# Deployment Preparation

## Frontend (Vercel)

The frontend is a static Vite build. Import the repository into Vercel and set the Root Directory to `frontend`.

Set this environment variable for each relevant Vercel environment:

```text
VITE_API_BASE_URL=https://your-backend-host.example/api
```

The included `frontend/vercel.json` uses `npm run build` and publishes `dist`. Deploy with the Vercel dashboard or, after installing and authenticating the CLI:

```bash
cd frontend
npx vercel
```

## Backend

Deploy `backend` on a Node.js-compatible service that can persist or bundle the generated `data-preparation/data/processed` JSON files. Set:

```text
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

`FRONTEND_URL` supports comma-separated origins. Do not run OSM extraction during server startup. Generate and validate data before deployment, then ensure the chosen full-Pune dataset or explicitly documented development dataset is available to the backend process.

No deployment has been performed by this project because no hosting credentials were provided.

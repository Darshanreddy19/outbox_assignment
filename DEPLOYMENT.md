# Deployment

## Recommended production layout

Use Render for both the Next.js frontend and the persistent Express API. The backend process also runs the BullMQ worker. Vercel functions are request-based and can stop between requests, so they should not run this worker.

You also need hosted MySQL and Redis. Render does not provide MySQL, so use PlanetScale, Aiven, or another hosted MySQL provider. Use Redis Cloud or Upstash for Redis.

The repository includes `render.yaml` for the two Render web services.

## Render deployment

1. Open [Render](https://render.com/) and connect your GitHub account.
2. Create a Blueprint from `Darshanreddy19/outbox_assignment`.
3. Render will detect `render.yaml` and create `outbox-backend` and `outbox-frontend`.
4. Use a paid backend instance so the BullMQ worker remains continuously running. A sleeping instance cannot reliably process scheduled email jobs.
5. Add the hosted MySQL and Redis values to the secret environment variables requested by Render.
6. After the first deploy, copy the generated backend and frontend URLs into `FRONTEND_URL` and `NEXT_PUBLIC_API_URL`.
7. Set `GOOGLE_REDIRECT_URI` to the backend callback URL and redeploy.

Deploy the database schema from the backend service shell:

```bash
npx prisma db push
```

Then verify:

```text
https://<backend-domain>/api/health
```

## 1. Deploy the backend and worker

Use Railway, Render, Fly.io, or another persistent Node.js host.

Set the service root directory to `backend` and use:

```text
Build command: npm install && npx prisma generate && npm run build
Start command: npm start
```

Set these backend environment variables:

```text
DATABASE_URL=<hosted MySQL connection string>
REDIS_HOST=<hosted Redis host>
REDIS_PORT=<hosted Redis port>
REDIS_PASSWORD=<hosted Redis password, if required>
REDIS_TLS=false
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_REDIRECT_URI=https://<backend-domain>/api/auth/google/callback
FRONTEND_URL=https://<vercel-domain>
PORT=3001
MAX_EMAILS_PER_HOUR=200
EMAIL_SEND_DELAY_MS=2000
WORKER_CONCURRENCY=5
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=<Ethereal username>
SMTP_PASSWORD=<Ethereal password>
```

After deployment, verify:

```text
https://<backend-domain>/api/health
```

The response should include `"redis":"connected"`.

## Frontend environment

Set this environment variable on the Render frontend service:

```text
NEXT_PUBLIC_API_URL=https://<backend-domain>
```

## Update Google OAuth

In Google Cloud Console, update the OAuth web client:

```text
Authorized JavaScript origin:
https://<frontend-domain>

Authorized redirect URI:
https://<backend-domain>/api/auth/google/callback
```

The local redirect URI can remain configured too:

```text
http://localhost:3001/api/auth/google/callback
```

## 4. Verify the complete deployment

Open the Render frontend URL and sign in with Google. Confirm that:

- The Google account chooser and consent screen appear.
- The dashboard loads after the callback.
- A scheduled email appears in Scheduled.
- The worker sends it and changes its status to Sent.
- The Ethereal preview URL appears in the backend logs.

Never add `.env` files, SMTP passwords, Google secrets, or database credentials to GitHub or Vercel source files. Add them only through the hosting provider's environment-variable settings.

## Why the backend should not run on Vercel

The API routes could be adapted to Vercel functions, but the BullMQ worker cannot be made reliable there because it requires a persistent Redis connection and continuous processing. Splitting the frontend and backend keeps scheduled delivery functional.

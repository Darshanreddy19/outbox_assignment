# Deployment

## Recommended production layout

Use Vercel for the Next.js frontend and a persistent Node.js service for the Express API and BullMQ worker. Vercel functions are request-based and can stop between requests, so they should not run the BullMQ worker.

You also need hosted MySQL and Redis. PlanetScale, Railway, or another MySQL provider can host the database. Upstash Redis or Redis Cloud can host Redis.

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

## 2. Deploy the frontend to Vercel

1. Import the GitHub repository into Vercel.
2. Select `frontend` as the Root Directory.
3. Keep the framework as Next.js.
4. Set the environment variable:

```text
NEXT_PUBLIC_API_URL=https://<backend-domain>
```

5. Deploy the project.

## 3. Update Google OAuth

In Google Cloud Console, update the OAuth web client:

```text
Authorized JavaScript origin:
https://<vercel-domain>

Authorized redirect URI:
https://<backend-domain>/api/auth/google/callback
```

The local redirect URI can remain configured too:

```text
http://localhost:3001/api/auth/google/callback
```

## 4. Verify the complete deployment

Open the Vercel URL and sign in with Google. Confirm that:

- The Google account chooser and consent screen appear.
- The dashboard loads after the callback.
- A scheduled email appears in Scheduled.
- The worker sends it and changes its status to Sent.
- The Ethereal preview URL appears in the backend logs.

Never add `.env` files, SMTP passwords, Google secrets, or database credentials to GitHub or Vercel source files. Add them only through the hosting provider's environment-variable settings.

## Why the backend should not run on Vercel

The API routes could be adapted to Vercel functions, but the BullMQ worker cannot be made reliable there because it requires a persistent Redis connection and continuous processing. Splitting the frontend and backend keeps scheduled delivery functional.

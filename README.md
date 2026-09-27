This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Running the full stack

The app talks to two services:

| Service | Dir | Port | URL |
| --- | --- | --- | --- |
| API backend (Express + Prisma/Postgres) | `../uberBackend` | 4000 | `http://localhost:4000/api` |
| Socket relay (Socket.IO) | `../uberSocketServer` | 4001 | `http://localhost:4001` |
| Frontend (this app) | `.` | 3000 | `http://localhost:3000` |

**1. Start the backend** (requires the Neon `DATABASE_URL` in `../uberBackend/.env`):

```bash
cd ../uberBackend
npm run db:push   # first time only — syncs the Prisma schema
npm run dev
```

**2. Start the socket relay:**

```bash
cd ../uberSocketServer
npm run dev
```

**3. Start the frontend:**

```bash
cp .env.example .env.local   # then fill in DATABASE_URL + BETTER_AUTH_SECRET + Gmail creds
npm run dev
```

Sign up one rider (`/signup`) and one driver (`/signup?role=driver`). Put the driver
online (their location is reported to the backend), request a ride from the rider app,
and accept it in the driver app — the rider sees the driver matched, live location and
ETA over the socket relay, and can rate the driver after the trip completes.

### Authentication (Better Auth)

Auth is handled by [Better Auth](https://better-auth.com), running inside this Next.js
app at `/api/auth/*`. It uses the **same Postgres database** as `uberBackend` (via the
shared `DATABASE_URL`) and the auth tables (`User`, `Session`, `Account`,
`Verification`) are defined in `../uberBackend/prisma/schema.prisma`.

Sign-in/sign-up is **email + password only**; phone number is an optional profile
field. Email verification is required: on sign-up Better Auth sends a verification
link via Gmail SMTP (`GMAIL_USER` + `GMAIL_APP_PASSWORD`, a Google App Password) and
the account can't sign in until the link is opened. If Gmail creds are unset, the
verification URL is logged to the Next.js server console instead.

The Express backend doesn't issue tokens; it validates the Better Auth session cookie
by forwarding it to `/api/auth/get-session` (set `BETTER_AUTH_URL`/`FRONTEND_URL` in
`../uberBackend/.env`).

### Mock mode

To preview the UI without the servers, set `NEXT_PUBLIC_USE_MOCK_API=true` in
`.env.local`. The app then uses the in-memory mock API and a simulated socket.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

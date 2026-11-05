# NoteVault installation guide

This educational application contains intentional vulnerabilities. Run it only on localhost and use demo credentials.

## Requirements

- Node.js 24 LTS and npm.
- Docker Desktop on Windows/macOS, or Docker Engine with the Compose plugin on Linux.
- Git.

Start Docker before continuing. On Windows, use Linux containers.

## 1. Download the project

```sh
git clone https://github.com/leevipun/csb-project
cd csb_project
npm ci
```

If you already have the project, run `npm ci` from the directory containing `package.json`.

## 2. Configure the environment

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On Linux or macOS:

```sh
cp .env.example .env
```

Generate an authentication secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `NEXTAUTH_SECRET` in `.env`. Keep `NEXTAUTH_URL` set to `http://127.0.0.1:3000` for the default port.

The example configuration connects to the local demo PostgreSQL database on port **5435**. Keep `.env` out of version control and do not use production credentials.

## 3. Set up the database

```sh
npm run db:up
npx prisma generate
npm run db:migrate
npm run db:seed
```

The seed command creates the demo accounts and notes. It clears existing data in the configured demo database.

## 4. Start the application

```sh
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

| Account | Email              | Password       |
| ------- | ------------------ | -------------- |
| Alice   | alice@example.test | AliceDemo!2026 |
| Bob     | bob@example.test   | BobDemo!2026   |

If port 3000 is occupied, set `NEXTAUTH_URL="http://127.0.0.1:3001"` in `.env`, run `npm run dev -- --port 3001` and open [http://127.0.0.1:3001](http://127.0.0.1:3001).

## Optional: Prisma Studio

In another terminal, run:

```sh
npm run db:studio
```

Open [http://127.0.0.1:5555](http://127.0.0.1:5555) to browse the local database.

## Stop the application

Press `Ctrl+C` in the application and Studio terminals. Stop PostgreSQL with:

```sh
npm run db:down
```

The Docker volume retains the database for the next startup.

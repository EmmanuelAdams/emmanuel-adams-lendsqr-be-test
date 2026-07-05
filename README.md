# Demo Credit Wallet Service

An MVP wallet service for **Demo Credit**, a mobile lending app. Borrowers use a
wallet to receive loan disbursements and to make repayments. This service lets a
user create an account, fund it, transfer funds to another user, and withdraw,
while ensuring anyone on the **Lendsqr Adjutor Karma** blacklist is never onboarded.

> Lendsqr Backend Engineering assessment submission by **Emmanuel Adams**.

---

## Tech stack

| Concern       | Choice                |
| ------------- | --------------------- |
| Runtime       | Node.js (LTS 22)      |
| Language      | TypeScript (strict)   |
| Web framework | Express               |
| Query builder | Knex.js               |
| Database      | MySQL                 |
| Validation    | Zod                   |
| Auth          | Faux JWT bearer token |
| Logging       | Pino                  |
| Testing       | Jest                  |

## Architecture

Layered, domain-oriented structure:

```
src/
  config/            # validated environment configuration
  common/
    api/response/     # SuccessResponse / ErrorResponse envelopes
    database/         # Knex instance, migrations, seeds
    errors/           # AppError hierarchy
    middleware/       # auth, rate limiting, error handling
    utils/            # logger, async handler
  domain/
    health/           # controller + route (template for feature domains)
  routes/             # root API router
  app.ts              # Express app assembly
  server.ts           # bootstrap + graceful shutdown
```

Request flow per domain: **Route -> Controller -> Service -> Repository -> Knex**.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # then fill in DB + Adjutor credentials

# 3. Run migrations
npm run migrate:latest

# 4. Start in watch mode
npm run dev
```

## Scripts

| Script                   | Purpose                       |
| ------------------------ | ----------------------------- |
| `npm run dev`            | Start with hot reload (tsx)   |
| `npm run build`          | Compile TypeScript to `dist/` |
| `npm start`              | Run the compiled build        |
| `npm run typecheck`      | Type-check without emitting   |
| `npm run lint`           | ESLint                        |
| `npm test`               | Run the Jest test suite       |
| `npm run test:cov`       | Tests with coverage           |
| `npm run migrate:latest` | Apply database migrations     |

## Quality gates

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files),
then `npm run build`, then `npm test`. A commit is rejected unless all pass.

---

## E-R diagram

_To be added (designed on https://app.dbdesigner.net/)._

## API reference

_To be added._

## Design decisions

_To be added: money representation, transaction scoping, Karma integration._

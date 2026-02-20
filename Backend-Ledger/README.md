# Banking Ledger System (Backend)

A production-grade, **double-entry banking ledger** built with Node.js, Express, MongoDB, Redis, and BullMQ — designed to demonstrate financial-grade backend engineering.

> **Built for interviews**: Every design decision in this codebase maps directly to a real-world banking requirement. The code comments explain *why*, not just *what*.

---

## Key Technical Features

| Feature | Technology | Why It Matters |
|---------|-----------|---------------|
| **Atomic Transactions (ACID)** | MongoDB Sessions | Transfer funds between accounts in a single atomic operation — if any step fails, everything rolls back |
| **Immutable Ledger** | Mongoose pre-hooks | Ledger entries cannot be modified or deleted — every financial change is a new append-only record |
| **Idempotency Keys** | Unique index | Duplicate requests (network retries) return the original result instead of double-charging |
| **Redis Balance Caching** | Cache-Aside Pattern | Sub-millisecond balance reads; cache is lazily populated and invalidated on every transaction |
| **Soft Account Closure** | Status enum | Accounts are soft-closed (status -> CLOSED) preserving all ledger entries for audit; zero-balance check prevents fund loss |
| **Reconciliation Engine** | BullMQ Worker | Background worker compares cached balances against ledger aggregations to detect Data Drift |
| **Async Webhooks + HMAC** | BullMQ + SHA-256 | Fire-and-forget webhook delivery with HMAC-SHA256 signed payloads for third-party integrations |
| **Structured Logging** | Winston + Correlation IDs | JSON logs with per-request UUID tracing via `AsyncLocalStorage` — debug any request across the entire stack |
| **API Rate Limiting** | express-rate-limit | Brute-force protection on login, spam protection on transactions — configurable via `.env` |
| **Multi-Stage Docker** | Distroless image | 150 MB production image with no shell, no package manager — minimal attack surface |

---

## Architecture

This service is containerized and deployed as part of the larger Banking System on AWS ECS.

## Engineering Decisions

### Why an Immutable Ledger?
In banking, you never `UPDATE` or `DELETE` a financial record. Every change is a **new ledger entry** — a DEBIT or CREDIT. This approach:
- Creates a complete **audit trail** (regulators like RBI/SEC require this)
- Prevents retroactive tampering (no one can silently change history)
- Enables balance derivation from first principles: `balance = Sum(credits) - Sum(debits)`

The Mongoose schema enforces immutability via `pre("updateOne")` and `pre("findOneAndUpdate")` hooks that throw errors.

### Why BullMQ for Webhooks?
The transaction API must respond in <100ms. Delivering webhooks involves HTTP calls to external servers that may be slow or down. BullMQ:
- **Decouples** webhook delivery from the transaction flow (non-blocking, fire-and-forget)
- **Retries** automatically with exponential backoff (3 attempts, 30s -> 60s -> 120s)
- **Persists** jobs in Redis — surviving server restarts
- **Guarantees** at-least-once delivery without slowing down the user

### Why a Reconciliation Engine?
Cached values (Redis) can silently diverge from the source of truth (MongoDB ledger) — this is called **Data Drift**. Common causes: missed cache busts, race conditions, Redis restarts. The reconciliation worker:
- Runs after every transaction (2-second delay)
- Independently aggregates the ledger and compares against the cache
- **Auto-heals** by re-caching from the ledger on mismatch
- Logs `CRITICAL` alerts for operational visibility

---

## API Documentation

Interactive Swagger documentation is available at:

```
http://localhost:3000/api-docs
```

### API Endpoints Summary

| Method | Endpoint | Auth | Rate Limited | Description |
|--------|----------|------|-------------|-------------|
| `POST` | `/api/auth/register` | No | No | Create a new user (with OTP verification) |
| `POST` | `/api/auth/login` | No | Yes 10/15min | Login and receive JWT |
| `POST` | `/api/auth/logout` | No | No | Blacklist current token |
| `POST` | `/api/accounts` | Yes | No | Create a new bank account |
| `GET` | `/api/accounts` | Yes | No | List your accounts |
| `GET` | `/api/accounts/balance/:id` | Yes | No | Get account balance (cached) |
| `DELETE` | `/api/accounts/:id` | Yes | No | Soft-close account (balance must be 0) |
| `POST` | `/api/transactions` | Yes | Yes 30/15min | Transfer funds (ACID) |
| `POST` | `/api/transactions/system/initial-funds` | Yes System | No | Seed an account with funds |
| `POST` | `/api/webhooks` | Yes | No | Register a webhook |
| `GET` | `/api/webhooks` | Yes | No | List your webhooks |
| `DELETE` | `/api/webhooks/:id` | Yes | No | Deactivate a webhook |

---

## Local Development

See the root `README.md` for full setup instructions.

### Environment variables

Copy `.env.example` to `.env` and fill in the required values.

```bash
cp .env.example .env
npm install
npm run dev
```

---

## Security Features

- **JWT Authentication** with token blacklisting on logout
- **Bcrypt** password hashing (10 salt rounds)
- **HMAC-SHA256** signed webhook payloads
- **Rate limiting** on login (anti brute-force) and transactions (anti spam)
- **Distroless** Docker image (no shell, no package manager)
- **Soft account closure** — balance must be zero before closing; ledger entries preserved for audit
- **Correlation IDs** for full request tracing
- **Idempotency keys** prevent duplicate transactions from network retries

---

## License

- FinLedger
- All rights reserved

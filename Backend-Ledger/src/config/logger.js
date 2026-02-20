const winston = require("winston")
const { AsyncLocalStorage } = require("async_hooks")

/**
 * Structured Logger with Correlation ID Support
 * ================================================
 *
 * WHY JSON LOGGING? (interview-ready)
 * ──────────────────────────────────
 *   Plain text logs like "User 123 logged in" are easy for HUMANS
 *   to read, but MACHINES can't parse them reliably.
 *
 *   In production, logs are shipped to aggregation platforms
 *   (ELK Stack, Datadog, CloudWatch).  These tools need structured
 *   data to:
 *     • Build dashboards  ("show me error rate per endpoint")
 *     • Create alerts     ("alert if >100 errors in 5 minutes")
 *     • Search/filter     ("find all logs for correlationId X")
 *
 *   JSON format gives every log entry predictable, queryable fields:
 *     { "level": "info", "message": "...", "correlationId": "...", "timestamp": "..." }
 *
 *   DevOps teams STRONGLY prefer JSON because:
 *     1. No regex needed to parse — JSON.parse() just works
 *     2. Fields are indexed automatically by log aggregators
 *     3. Correlation IDs become filterable first-class fields
 *     4. Structured errors include stack traces as proper fields
 *
 * ──────────────────────────────────
 * WHAT IS AsyncLocalStorage?
 * ──────────────────────────────────
 *   Node.js is single-threaded but handles many requests concurrently
 *   via the event loop.  When User A and User B hit the API at the
 *   same time, their log lines are INTERLEAVED:
 *
 *     [info] Finding account...        ← which user?
 *     [info] Checking balance...       ← User A or B?
 *     [info] Transaction created       ← impossible to tell
 *
 *   AsyncLocalStorage is a Node.js built-in that creates a "request-
 *   scoped storage" — like thread-local storage in Java.  Any code
 *   that runs within the same async context (same request) can read
 *   the correlationId without it being passed as an argument.
 *
 *   This means we DON'T have to add `correlationId` as a parameter
 *   to every single function in the codebase.  The logger reads it
 *   automatically from the async context.
 */

// ── AsyncLocalStorage instance (shared across the entire app) ──
const asyncLocalStorage = new AsyncLocalStorage()

/**
 * Winston format that automatically injects the correlationId
 * from the current async context into every log entry.
 */
const correlationIdFormat = winston.format((info) => {
    const store = asyncLocalStorage.getStore()
    if (store && store.correlationId) {
        info.correlationId = store.correlationId
    }
    return info
})

/**
 * The logger instance.
 *
 * In development: colorized, human-readable lines
 * In production:  pure JSON, one object per line
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        correlationIdFormat(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        winston.format.errors({ stack: true })
    ),
    defaultMeta: { service: "banking-ledger" },
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === "production"
                ? winston.format.json()
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ timestamp, level, message, correlationId, service, ...meta }) => {
                        const cid = correlationId ? ` [${correlationId}]` : ""
                        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""
                        return `${timestamp} ${level}${cid}: ${message}${extra}`
                    })
                )
        })
    ]
})

module.exports = { logger, asyncLocalStorage }

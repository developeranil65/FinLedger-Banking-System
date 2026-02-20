const { v4: uuidv4 } = require("uuid")
const { asyncLocalStorage } = require("../config/logger")

/**
 * Correlation ID Middleware
 * -------------------------
 * Runs on EVERY incoming HTTP request, before any route handler.
 *
 * ═══════════════════════════════════════════════════════════════
 *  HOW CORRELATION IDs SOLVE THE "INTERLEAVED LOGS" PROBLEM
 * ═══════════════════════════════════════════════════════════════
 *
 *  Without Correlation IDs (chaotic):
 *    [info] Validating request...
 *    [info] Checking balance...          ← User A? User B? User C?
 *    [error] Insufficient funds
 *    [info] Transaction created
 *
 *  With Correlation IDs (traceable):
 *    [info] [abc-123] Validating request...
 *    [info] [def-456] Checking balance...     ← clearly User B
 *    [error] [abc-123] Insufficient funds     ← clearly User A
 *    [info] [def-456] Transaction created     ← clearly User B
 *
 *  Now you can filter by correlationId in your log aggregator
 *  (e.g., Kibana: `correlationId: "abc-123"`) and see the ENTIRE
 *  journey of a single request — from auth → controller → DB →
 *  response — in chronological order.
 *
 *  This is ESSENTIAL for debugging in production where hundreds
 *  of requests are being processed concurrently.
 * ═══════════════════════════════════════════════════════════════
 *
 * HOW IT WORKS:
 *   1. Generate a UUID v4 (or use the client's if provided)
 *   2. Attach it to `req.correlationId`
 *   3. Set `X-Correlation-ID` response header so the client
 *      can include it in bug reports
 *   4. Run the rest of the request inside an AsyncLocalStorage
 *      context so the logger can access the ID without explicit
 *      parameter passing
 */
function correlationIdMiddleware(req, res, next) {
    // Allow the client to pass their own correlation ID
    // (useful for tracing across multiple microservices)
    const correlationId = req.headers["x-correlation-id"] || uuidv4()

    // Attach to req for controllers that need it
    req.correlationId = correlationId

    // Set on response so the client can see it
    res.setHeader("X-Correlation-ID", correlationId)

    // Run the entire downstream chain inside this async context
    // Any code that calls asyncLocalStorage.getStore() will get
    // back { correlationId } — this is how the logger picks it up
    asyncLocalStorage.run({ correlationId }, () => {
        next()
    })
}

module.exports = correlationIdMiddleware

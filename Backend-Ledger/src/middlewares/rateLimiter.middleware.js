const rateLimit = require("express-rate-limit")
const { logger } = require("../config/logger")

/**
 * Rate Limiter Middleware
 * -----------------------
 * Protects critical endpoints from abuse.
 *
 * HOW express-rate-limit WORKS:
 *   It tracks the number of requests from each IP address within
 *   a sliding time window.  If an IP exceeds the limit, subsequent
 *   requests receive HTTP 429 (Too Many Requests) until the window
 *   resets.
 *
 * WHY different limits for different endpoints?
 *   • Login:       Low limit (10/15min) — brute-force attack target.
 *                  An attacker trying passwords needs thousands of
 *                  attempts; limiting to 10 makes this impractical.
 *
 *   • Transactions: Moderate limit (30/15min) — legitimate users
 *                  might do several transfers, but no one needs
 *                  to do 100 in 15 minutes.  Prevents scripted
 *                  abuse that could spam the ledger.
 *
 * CONFIGURABILITY:
 *   All values come from .env so ops teams can tune them in
 *   production without code changes.
 */

/**
 * Auth Rate Limiter — for /api/auth/login
 * Prevents brute-force password attacks.
 */
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,   // 10 attempts per window
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,   // Disable `X-RateLimit-*` headers
    message: {
        message: "Too many login attempts. Please try again after 15 minutes.",
        retryAfter: "15 minutes"
    },
    handler: (req, res, next, options) => {
        logger.warn("Rate limit exceeded on auth endpoint", {
            ip: req.ip,
            path: req.originalUrl
        })
        res.status(options.statusCode).json(options.message)
    }
})

/**
 * Transaction Rate Limiter — for /api/transactions
 * Prevents ledger spam from automated scripts.
 */
const transactionLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_TXN_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_TXN_MAX) || 30,   // 30 transactions per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many transactions. Please try again later.",
        retryAfter: "15 minutes"
    },
    handler: (req, res, next, options) => {
        logger.warn("Rate limit exceeded on transaction endpoint", {
            ip: req.ip,
            path: req.originalUrl
        })
        res.status(options.statusCode).json(options.message)
    }
})

module.exports = { authLimiter, transactionLimiter }

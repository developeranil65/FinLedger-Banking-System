const { Worker } = require("bullmq")
const connection = require("../config/redis")
const axios = require("axios")
const crypto = require("crypto")
const { logger } = require("../config/logger")

/**
 * Webhook Delivery Worker  (Consumer Side)
 * -----------------------------------------
 * This file is imported in server.js so the worker starts alongside
 * the Express server.  It listens to the "webhook-delivery" queue
 * and processes each job as follows:
 *
 *   1. Take the job data  → { targetUrl, payload, secretKey }
 *   2. Stringify the payload (canonical JSON)
 *   3. HMAC-SHA256 sign it using the client's secretKey
 *   4. POST to targetUrl with the signature in X-Ledger-Signature
 *   5. If the external server returns 5xx  → throw → BullMQ retries
 *      automatically with the exponential backoff we configured in
 *      the queue producer.
 *
 * HMAC-SHA256 EXPLAINED (interview-ready):
 *   HMAC = Hash-based Message Authentication Code.
 *   We feed two inputs into the algorithm:
 *     • the raw JSON body   (the "message")
 *     • the client's secret (the "key")
 *   The output is a fixed-length hex digest.
 *   The client recomputes the same digest on their side.  If the
 *   digests match → the payload was NOT tampered with AND it genuinely
 *   came from someone who knows the secret.
 *   We use SHA-256 because it is collision-resistant and fast.
 */

/**
 * signPayload – create HMAC-SHA256 hex signature
 *
 * @param {string} body      – JSON string of the payload
 * @param {string} secret    – the per-subscription secretKey
 * @returns {string}         – hex-encoded HMAC digest
 */
function signPayload(body, secret) {
    return crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex")
}

const webhookWorker = new Worker(
    "webhook-delivery",
    async (job) => {
        const { targetUrl, payload, secretKey } = job.data

        // 1. Canonical JSON string (must match what the client will verify)
        const bodyString = JSON.stringify(payload)

        // 2. Compute HMAC signature
        const signature = signPayload(bodyString, secretKey)

        logger.info("Delivering webhook", {
            jobId: job.id,
            targetUrl,
            attempt: job.attemptsMade + 1,
            maxAttempts: job.opts.attempts
        })

        // 3. POST to the external server
        const response = await axios.post(targetUrl, payload, {
            headers: {
                "Content-Type": "application/json",
                "X-Ledger-Signature": signature
            },
            timeout: 10000   // 10-second timeout to avoid hanging
        })

        /**
         * 4. Decide: retry or accept?
         *    - 2xx  → success, job completes
         *    - 5xx  → server error on the client's side, worth retrying
         *    - 4xx  → client bug (bad URL, auth, etc.) — retrying won't help
         *
         *    By throwing on 5xx, BullMQ automatically schedules the next
         *    attempt using the exponential backoff we configured.
         */
        if (response.status >= 500) {
            throw new Error(
                `Webhook target returned ${response.status} — will retry`
            )
        }

        logger.info("Webhook delivered successfully", { jobId: job.id })
    },
    {
        connection,
        concurrency: 5,          // process up to 5 webhook deliveries in parallel
        drainDelay: 30,          // wait 30s between polls when queue is empty (default: 5s)
        stalledInterval: 120000, // check stalled jobs every 2 min (default: 30s)
        maxStalledCount: 2       // mark job as stalled after 2 missed heartbeats
    }
)

// ── Lifecycle event listeners (observability) ────────────────────────

webhookWorker.on("completed", (job) => {
    logger.info("Webhook job completed", { jobId: job.id })
})

webhookWorker.on("failed", (job, err) => {
    logger.error("Webhook job failed", {
        jobId: job.id,
        attempts: job.attemptsMade,
        error: err.message
    })
})

module.exports = webhookWorker

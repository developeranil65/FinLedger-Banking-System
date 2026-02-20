const { Queue } = require("bullmq")
const connection = require("../config/redis")

/**
 * Webhook Delivery Queue  (Producer Side)
 * ----------------------------------------
 * WHY BullMQ?
 *   Our main transaction controller must respond to the client ASAP.
 *   We don't want it to wait while we POST to potentially slow external
 *   servers.  BullMQ pushes a lightweight JSON job into Redis and returns
 *   immediately.  A separate Worker process (webhook.worker.js) picks up
 *   the job and delivers it.
 *
 * WHY Redis?
 *   Redis is an in-memory store, so enqueuing a job takes < 1 ms.
 *   BullMQ uses Redis Streams under the hood, which gives us persistence,
 *   ordering, and exactly-once delivery guarantees.
 *
 * CONNECTION:
 *   We import the shared IORedis connection from config/redis.js.
 *   This avoids opening multiple TCP sockets to Redis.
 */

const webhookQueue = new Queue("webhook-delivery", { connection })

/**
 * addWebhookJob – Enqueues one webhook delivery job
 *
 * @param {Object} data
 * @param {string} data.targetUrl  – where to POST
 * @param {Object} data.payload    – the JSON body
 * @param {string} data.secretKey  – HMAC signing key
 *
 * Job options explained:
 *   attempts : 5          → retry up to 5 times on failure
 *   backoff  : exponential, 3 000 ms base
 *       Retry 1 →  3 s
 *       Retry 2 →  6 s
 *       Retry 3 → 12 s
 *       Retry 4 → 24 s
 *       Retry 5 → 48 s
 *   This prevents hammering a struggling server while still ensuring
 *   delivery within a reasonable window (~93 seconds total).
 *
 *   removeOnComplete : true  → clean up Redis after success
 *   removeOnFail     : false → keep failed jobs for debugging / DLQ
 */
async function addWebhookJob(data) {
    await webhookQueue.add("deliver-webhook", data, {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 3000
        },
        removeOnComplete: true,
        removeOnFail: false
    })
}

module.exports = { webhookQueue, addWebhookJob }

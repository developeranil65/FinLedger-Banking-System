const WebhookSubscription = require("../models/webhookSubscription.model")
const { addWebhookJob } = require("../queues/webhook.queue")
const { logger } = require("../config/logger")

/**
 * Webhook Service
 * Manages webhook delivery logic (finding subscribers, shaping payloads).
 * Follows "Fire and Forget" pattern to avoid blocking the API response.
 */

/**
 * Trigger webhooks for a completed transaction.
 * @param {Object} transaction - The Mongoose transaction document
 */
async function triggerTransactionWebhooks(transaction) {
    try {
        const subscriptions = await WebhookSubscription.find({
            event: "TRANSACTION_COMPLETED",
            isActive: true
        })

        if (subscriptions.length === 0) {
            logger.info("No active webhook subscriptions found, skipping")
            return
        }

        const payload = {
            event: "TRANSACTION_COMPLETED",
            data: {
                transactionId: transaction._id,
                fromAccount: transaction.fromAccount,
                toAccount: transaction.toAccount,
                amount: transaction.amount,
                status: transaction.status,
                completedAt: new Date().toISOString()
            }
        }

        const enqueuePromises = subscriptions.map((sub) =>
            addWebhookJob({
                targetUrl: sub.targetUrl,
                payload,
                secretKey: sub.secretKey
            })
        )

        await Promise.all(enqueuePromises)

        logger.info("Webhook jobs enqueued", {
            count: subscriptions.length,
            transactionId: transaction._id
        })
    } catch (error) {
        logger.error("Error enqueuing webhook jobs", { error: error.message })
    }
}

module.exports = { triggerTransactionWebhooks }

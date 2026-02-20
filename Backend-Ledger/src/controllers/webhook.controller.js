const WebhookSubscription = require("../models/webhookSubscription.model")

/**
 * Register a new webhook subscription.
 * Returns the created subscription INCLUDING secretKey (shown once).
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createWebhook(req, res) {
    const { targetUrl, event } = req.body

    if (!targetUrl) {
        return res.status(400).json({
            message: "targetUrl is required"
        })
    }

    const subscription = await WebhookSubscription.create({
        userId: req.user._id,
        targetUrl,
        event: event || "TRANSACTION_COMPLETED"
    })

    return res.status(201).json({
        message: "Webhook subscription created successfully",
        subscription: {
            _id: subscription._id,
            targetUrl: subscription.targetUrl,
            event: subscription.event,
            secretKey: subscription.secretKey,    // ← shown ONLY here
            isActive: subscription.isActive,
            createdAt: subscription.createdAt
        }
    })
}

/**
 * List all subscriptions belonging to the authenticated user.
 * secretKey is excluded for security.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getWebhooks(req, res) {
    const subscriptions = await WebhookSubscription.find({
        userId: req.user._id
    }).select("-secretKey")    // never leak the HMAC key in list view

    return res.status(200).json({ subscriptions })
}

/**
 * Soft-delete a webhook subscription.
 * Sets isActive to false.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteWebhook(req, res) {
    const subscription = await WebhookSubscription.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isActive: false },
        { new: true }
    )

    if (!subscription) {
        return res.status(404).json({
            message: "Webhook subscription not found"
        })
    }

    return res.status(200).json({
        message: "Webhook subscription deactivated",
        subscription: {
            _id: subscription._id,
            targetUrl: subscription.targetUrl,
            isActive: subscription.isActive
        }
    })
}

module.exports = {
    createWebhook,
    getWebhooks,
    deleteWebhook
}

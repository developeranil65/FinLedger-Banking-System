const mongoose = require("mongoose")
const { v4: uuidv4 } = require("uuid")

/**
 * WebhookSubscription Schema
 * ---------------------------
 * Stores a third-party client's webhook registration.
 *
 * WHY each field exists:
 *  - userId      → ties the subscription to the banking user who owns it.
 *  - targetUrl   → the external HTTPS endpoint we will POST to.
 *  - secretKey   → a per-subscription HMAC key so each client can verify
 *                   that the payload genuinely came from our ledger service.
 *  - event       → the event type this subscription listens to.
 *                   Right now only "TRANSACTION_COMPLETED" is supported,
 *                   but the field makes the system extensible for future events
 *                   like "TRANSACTION_FAILED" or "ACCOUNT_FROZEN".
 *  - isActive    → soft-delete flag. Instead of removing rows we flip this
 *                   to false, which protects audit history.
 */

const webhookSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Webhook subscription must be associated with a user"],
        index: true
    },
    targetUrl: {
        type: String,
        required: [true, "Target URL is required for webhook subscription"],
        validate: {
            validator: function (url) {
                return /^https?:\/\/.+/.test(url)
            },
            message: "targetUrl must be a valid HTTP/HTTPS URL"
        }
    },
    secretKey: {
        type: String,
        required: true,
        default: () => uuidv4()  // auto-generate a unique HMAC key
    },
    event: {
        type: String,
        enum: {
            values: ["TRANSACTION_COMPLETED"],
            message: "Event must be TRANSACTION_COMPLETED"
        },
        default: "TRANSACTION_COMPLETED"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Compound index → fast look-up: "give me all active hooks for this user"
webhookSubscriptionSchema.index({ userId: 1, event: 1, isActive: 1 })

const WebhookSubscription = mongoose.model(
    "webhookSubscription",
    webhookSubscriptionSchema
)

module.exports = WebhookSubscription

const { Router } = require("express")
const { authMiddleware } = require("../middlewares/auth.middleware")
const webhookController = require("../controllers/webhook.controller")

const webhookRouter = Router()

/**
 * POST   /api/webhooks       → Register a new webhook
 * GET    /api/webhooks       → List your webhooks
 * DELETE /api/webhooks/:id   → Deactivate a webhook
 *
 * All routes require authentication via authMiddleware.
 */

webhookRouter.post("/", authMiddleware, webhookController.createWebhook)
webhookRouter.get("/", authMiddleware, webhookController.getWebhooks)
webhookRouter.delete("/:id", authMiddleware, webhookController.deleteWebhook)

module.exports = webhookRouter

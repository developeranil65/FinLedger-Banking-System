const { Router } = require("express")
const { authMiddleware } = require("../middlewares/auth.middleware")
const reconcileController = require("../controllers/reconcile.controller")

const reconcileRouter = Router()

/**
 * POST /api/reconcile/:accountId
 * Trigger a reconciliation check from the Admin Console.
 */
reconcileRouter.post(
    "/:accountId",
    authMiddleware,
    reconcileController.triggerReconciliation
)

module.exports = reconcileRouter

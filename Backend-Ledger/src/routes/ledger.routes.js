const { Router } = require("express")
const { authMiddleware } = require("../middlewares/auth.middleware")
const ledgerController = require("../controllers/ledger.controller")

const ledgerRouter = Router()

/**
 * GET /api/ledger/:accountId
 * Fetch ledger entries for the Transaction History table.
 */
ledgerRouter.get(
    "/:accountId",
    authMiddleware,
    ledgerController.getLedgerEntries
)

module.exports = ledgerRouter

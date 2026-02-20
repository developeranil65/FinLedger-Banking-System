const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const transactionController = require("../controllers/transaction.controller")
const { transactionLimiter } = require("../middlewares/rateLimiter.middleware")

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction — rate limited to prevent ledger spam
 */

transactionRoutes.post("/", transactionLimiter, authMiddleware.authMiddleware, transactionController.createTransaction)


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

/**
 * - POST /api/transactions/deposit
 * - Self-service deposit (fund your own account)
 */
transactionRoutes.post("/deposit", authMiddleware.authMiddleware, transactionController.depositFunds)

module.exports = transactionRoutes;
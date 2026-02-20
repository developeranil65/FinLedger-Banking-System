const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const accountController = require("../controllers/account.controller")


const router = express.Router()



/**
 * POST /api/accounts/
 * Create a new account.
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)


/**
 * GET /api/accounts/
 * Get all accounts of the logged-in user.
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)


/**
 * GET /api/accounts/balance/:accountId
 * Get account balance.
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)


/**
 * DELETE /api/accounts/:accountId
 * Soft-close an account. Ledger entries are preserved.
 */
router.delete("/:accountId", authMiddleware.authMiddleware, accountController.closeAccountController)



module.exports = router
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");


/**
 * Create a new account for the authenticated user.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createAccountController(req, res) {

    const user = req.user;

    const account = await accountModel.create({
        user: user._id
    })

    emailService.sendAccountCreationEmail(user.email, user.name, account._id.toString())

    res.status(201).json({
        account
    })

}

/**
 * Get all accounts for the authenticated user.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserAccountsController(req, res) {

    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
        accounts
    })
}

/**
 * Get balance for a specific account.
 * Checks cache first, then falls back to database.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAccountBalanceController(req, res) {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const balanceCacheService = require("../services/balanceCache.service")
    const cached = await balanceCacheService.getCachedBalance(accountId)
    const source = cached !== null ? "cache" : "database"

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance,
        source: source
    })
}


/**
 * Soft-close an account.
 * Sets status to CLOSED.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function closeAccountController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        })

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            })
        }

        if (account.status === "CLOSED") {
            return res.status(400).json({
                message: "Account is already closed"
            })
        }

        const balance = await account.getBalance();
        if (balance !== 0) {
            return res.status(400).json({
                message: `Cannot close account with non-zero balance (current balance: ₹${balance}). Please withdraw or transfer all funds first.`
            })
        }

        account.status = "CLOSED";
        await account.save();

        emailService.sendAccountClosureEmail(req.user.email, req.user.name, account._id.toString())

        return res.status(200).json({
            message: "Account closed successfully. Ledger entries remain available for audit.",
            account: {
                _id: account._id,
                status: account.status,
                closedAt: account.updatedAt
            }
        })
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Failed to close account"
        })
    }
}


module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    closeAccountController
}
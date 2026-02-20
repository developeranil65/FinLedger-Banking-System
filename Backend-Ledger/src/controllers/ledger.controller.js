const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const { logger } = require("../config/logger")

/**
 * Get last 50 ledger entries for an account.
 * Entries are sorted newest-first.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getLedgerEntries(req, res) {
    const { accountId } = req.params

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({ message: "Account not found" })
    }

    const entries = await ledgerModel
        .find({ account: accountId })
        .sort({ _id: -1 })
        .limit(50)
        .populate("transaction", "status idempotencyKey createdAt")
        .lean()

    logger.info("Ledger entries fetched", {
        accountId,
        count: entries.length
    })

    res.status(200).json({ entries })
}

module.exports = { getLedgerEntries }

const accountModel = require("../models/account.model")
const ledgerModel = require("../models/ledger.model")
const balanceCacheService = require("../services/balanceCache.service")
const { logger } = require("../config/logger")

/**
 * Trigger a synchronous reconciliation check for the given account
 * Runs inline for immediate feedback in the Admin Console
 * Returns status OK, CACHE_MISS, or DRIFT_DETECTED
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function triggerReconciliation(req, res) {
    const { accountId } = req.params

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({ message: "Account not found" })
    }

    const cachedBalance = await balanceCacheService.getCachedBalance(accountId)

    const result = await ledgerModel.aggregate([
        { $match: { account: account._id } },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            { $multiply: ["$amount", -1] }
                        ]
                    }
                }
            }
        }
    ])

    const ledgerBalance = result.length > 0 ? result[0].balance : 0

    const report = { cachedBalance, ledgerBalance }

    if (cachedBalance === null) {
        report.status = "CACHE_MISS"
        report.message = "Cache is empty — no drift detected, balance computed from ledger."
        logger.info("Reconciliation: cache miss", { accountId, ledgerBalance })
    } else if (Math.abs(cachedBalance - ledgerBalance) < 0.01) {
        report.status = "OK"
        report.delta = 0
        report.message = "✓ Ledger matches cached balance. Data integrity confirmed."
        logger.info("Reconciliation OK", { accountId, cachedBalance, ledgerBalance })
    } else {
        report.status = "DRIFT_DETECTED"
        report.delta = cachedBalance - ledgerBalance
        report.message = "⚠ DATA DRIFT DETECTED — cache has been auto-healed."

        await balanceCacheService.bustBalanceCache(accountId)
        await balanceCacheService.setCachedBalance(accountId, ledgerBalance)

        logger.error("RECONCILIATION DRIFT", {
            accountId,
            cachedBalance,
            ledgerBalance,
            delta: report.delta
        })
    }

    res.status(200).json(report)
}

module.exports = { triggerReconciliation }

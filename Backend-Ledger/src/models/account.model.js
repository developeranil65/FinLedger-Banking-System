const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, "Account must be associated with a user"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['ACTIVE', 'FROZEN', "CLOSED"],
            message: 'Status must be either ACTIVE, FROZEN, or CLOSED'
        },
        default: 'ACTIVE'
    },
    currency: {
        type: String,
        required: [true, "Currency is required for creation of account"],
        default: "INR"
    },
}, { timestamps: true })

// compound index
accountSchema.index({ user: 1, status: 1 });

/**
 * Get the current balance for this account.
 * Uses Cache-Aside pattern: checks Redis first, then aggregates ledger entries.
 * @returns {Promise<{balance: number, source: string}>} Balance and source ("cache" or "database")
 */
accountSchema.methods.getBalance = async function () {
    // Lazy-require to avoid circular dependency at module load time.
    // These modules are only loaded ONCE (Node caches them after first require).
    const balanceCacheService = require("../services/balanceCache.service")
    const ledgerModel = require("./ledger.model")

    const accountId = this._id.toString()

    const cached = await balanceCacheService.getCachedBalance(accountId)
    if (cached !== null) {
        return { balance: cached, source: "cache" }
    }

    const result = await ledgerModel.aggregate([
        {
            $match: { account: this._id }
        },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",        // CREDIT  → +amount
                            { $multiply: ["$amount", -1] }  // DEBIT → −amount
                        ]
                    }
                }
            }
        }
    ])

    // If no ledger entries exist yet, balance is 0
    const balance = result.length > 0 ? result[0].balance : 0

    await balanceCacheService.setCachedBalance(accountId, balance)

    return { balance, source: "database" }
}


const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;
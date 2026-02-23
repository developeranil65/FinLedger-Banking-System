const redis = require("../config/redis")
const { logger } = require("../config/logger")

/**
 * Balance Cache Service
 * Implements the data-access layer for Redis-cached account balances.
 * Key format: balance:<accountId>
 */

const BALANCE_TTL_SECONDS = 1800  // 30 minutes (cache is busted on every transaction)

/**
 * Get cached balance for an account.
 * @param {string} accountId - Mongoose ObjectId as string
 * @returns {Promise<number|null>} Cached balance or null if miss
 */
async function getCachedBalance(accountId) {
    const cached = await redis.get(`balance:${accountId}`)

    if (cached !== null) {
        logger.debug("Balance cache HIT", { accountId })
        return parseFloat(cached)
    }

    logger.debug("Balance cache MISS", { accountId })
    return null
}

/**
 * Write balance to cache with TTL.
 * @param {string} accountId - Account ID
 * @param {number} balance - Current balance
 */
async function setCachedBalance(accountId, balance) {
    await redis.set(
        `balance:${accountId}`,
        balance.toString(),
        "EX",
        BALANCE_TTL_SECONDS
    )
    logger.info("Balance cache SET", { accountId, balance })
}

/**
 * Invalidate (delete) the cached balance.
 * Forces next read to recompute from source of truth.
 * @param {string} accountId - Account ID
 */
async function bustBalanceCache(accountId) {
    await redis.del(`balance:${accountId}`)
    logger.info("Balance cache BUSTED", { accountId })
}

module.exports = {
    getCachedBalance,
    setCachedBalance,
    bustBalanceCache
}

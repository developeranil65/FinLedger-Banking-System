const { Queue } = require("bullmq")
const connection = require("../config/redis")

/**
 * Reconciliation Queue  (Producer Side)
 * ---------------------------------------
 * Enqueues background jobs that verify cached/stored balances
 * match the immutable ledger.  This is the "trust but verify"
 * layer of the banking system.
 *
 * WHY a separate queue (not the webhook queue)?
 *   Different concerns, different retry policies, different
 *   priorities.  Webhook delivery is user-facing; reconciliation
 *   is an internal audit.  Keeping them separate means a flood
 *   of reconciliation jobs can't starve webhook delivery.
 */

const reconciliationQueue = new Queue("reconciliation", { connection })

/**
 * addReconciliationJob — schedule a balance verification
 *
 * @param {string} accountId — the account to reconcile
 *
 * Job options:
 *   attempts: 3     → retry on transient Mongo/Redis errors
 *   backoff:  5 s exponential
 *   delay:    2000  → wait 2 seconds before processing, giving
 *                     MongoDB replication a moment to catch up
 */
async function addReconciliationJob(accountId) {
    await reconciliationQueue.add(
        "reconcile-balance",
        { accountId },
        {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
            delay: 2000,
            removeOnComplete: true,
            removeOnFail: false
        }
    )
}

module.exports = { reconciliationQueue, addReconciliationJob }

const { Worker } = require("bullmq")
const connection = require("../config/redis")
const ledgerModel = require("../models/ledger.model")
const mongoose = require("mongoose")
const balanceCacheService = require("../services/balanceCache.service")
const { logger } = require("../config/logger")

/**
 * Reconciliation Worker
 * ----------------------
 * A background process that detects DATA DRIFT — the silent divergence
 * between what the cache (or a stored balance field) says and what the
 * immutable ledger actually computes.
 *
 * ═══════════════════════════════════════════════════════════════
 *  WHAT IS DATA DRIFT?
 * ═══════════════════════════════════════════════════════════════
 *
 *  In a financial system, the LEDGER is the legal source of truth.
 *  Every other representation of the balance (Redis cache, a
 *  pre-computed `balance` column, a dashboard widget) is a
 *  DERIVED value.
 *
 *  Data Drift occurs when a derived value silently goes out of
 *  sync with the source of truth.  Common causes:
 *    • A cache bust was missed (deploy bug)
 *    • A direct DB edit bypassed the application code
 *    • A race condition between two concurrent transactions
 *    • Redis lost data after an unexpected restart (no AOF)
 *
 *  WHY IS RECONCILIATION NECESSARY?
 *    Regulations (SOX, PCI-DSS, PSD2) require banks to prove
 *    their numbers are accurate.  A reconciliation engine is the
 *    automated auditor that continuously verifies this — catching
 *    drift minutes after it happens, not weeks later during a
 *    manual audit.
 * ═══════════════════════════════════════════════════════════════
 *
 * WHAT THIS WORKER DOES:
 *   1. Receives { accountId } from the reconciliation queue
 *   2. Reads the cached balance from Redis (if any)
 *   3. Runs a MongoDB aggregation on the ledger to compute the TRUE balance
 *   4. Compares the two:
 *      • Match     → logs ✓ OK
 *      • Mismatch  → logs 🚨 CRITICAL ALERT with both values + delta
 */

const reconciliationWorker = new Worker(
    "reconciliation",
    async (job) => {
        const { accountId } = job.data
        const objectId = new mongoose.Types.ObjectId(accountId)

        logger.info("Reconciliation check started", { accountId })

        // ── Step 1: Get the cached balance (what we THINK the balance is) ──
        const cachedBalance = await balanceCacheService.getCachedBalance(accountId)

        // ── Step 2: Compute the TRUE balance from the immutable ledger ──
        //
        // This aggregation is identical to getBalance() in account.model.js.
        // We intentionally DUPLICATE it here so the reconciliation worker
        // is fully independent — it doesn't trust the model's cache logic.
        const result = await ledgerModel.aggregate([
            {
                $match: { account: objectId }
            },
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

        // ── Step 3: Build the reconciliation report ──
        const report = {
            accountId,
            cachedBalance,
            ledgerBalance,
            cacheAvailable: cachedBalance !== null,
            timestamp: new Date().toISOString()
        }

        // ── Step 4: Compare and alert ──
        if (cachedBalance === null) {
            // Cache was empty (busted or expired) — not a drift, just a miss
            logger.info("Reconciliation: cache empty, no drift", {
                accountId,
                ledgerBalance
            })
            report.status = "CACHE_MISS"
            return report
        }

        if (Math.abs(cachedBalance - ledgerBalance) < 0.01) {
            // Match (within floating-point tolerance)
            logger.info("Reconciliation OK", {
                accountId,
                cachedBalance,
                ledgerBalance
            })
            report.status = "OK"
            return report
        }

        // ── MISMATCH — DATA DRIFT DETECTED ──
        const delta = cachedBalance - ledgerBalance
        logger.error("CRITICAL: DATA DRIFT DETECTED", {
            accountId,
            cachedBalance,
            ledgerBalance,
            delta,
            action: "Busting cache and re-caching from ledger"
        })

        // Auto-heal: bust the stale cache, let the next read recompute
        await balanceCacheService.bustBalanceCache(accountId)
        await balanceCacheService.setCachedBalance(accountId, ledgerBalance)

        report.status = "DRIFT_DETECTED"
        report.delta = delta
        return report
    },
    {
        connection,
        concurrency: 3
    }
)

// ── Lifecycle event listeners ──

reconciliationWorker.on("completed", (job, result) => {
    logger.info("Reconciliation job completed", {
        jobId: job.id,
        status: result?.status || "unknown"
    })
})

reconciliationWorker.on("failed", (job, err) => {
    logger.error("Reconciliation job failed", {
        jobId: job.id,
        error: err.message
    })
})

module.exports = reconciliationWorker

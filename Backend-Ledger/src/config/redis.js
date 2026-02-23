const IORedis = require("ioredis")
const { logger } = require("./logger")

/**
 * Shared Redis Connection
 * ------------------------
 * WHY a single shared connection?
 *   Every IORedis instance opens a TCP socket to Redis.  If each module
 *   (BullMQ queue, BullMQ worker, balance cache) creates its own
 *   connection, we waste file descriptors and slow down startup.
 *
 *   By exporting ONE instance from this config file, every module
 *   `require("../config/redis")` gets the **same** object — one TCP
 *   socket, one heartbeat.
 *
 * NOTE on `maxRetriesPerRequest: null`:
 *   BullMQ requires this setting.  Without it BullMQ would throw
 *   "ReplyError: MAXRETRIES" after 20 failed attempts, crashing the
 *   worker.  Setting it to null means "retry forever" — which is what
 *   we want for a long-running background process.
 *
 * WHY Redis for balances but MongoDB for the Ledger?
 *   ┌──────────┬───────────────────┬────────────────────────────┐
 *   │          │ Redis (in-memory) │ MongoDB (disk-persistent)  │
 *   ├──────────┼───────────────────┼────────────────────────────┤
 *   │ Speed    │ ~0.1 ms reads     │ ~2-10 ms reads             │
 *   │ Persist  │ Optional (RDB/AOF)│ Always (journaled)         │
 *   │ Use-case │ Hot data / cache  │ Source of truth / audit log │
 *   └──────────┴───────────────────┴────────────────────────────┘
 */

const redis = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: true,          // don't open TCP until first command — serverless-friendly
    enableOfflineQueue: true    // queue commands while reconnecting instead of failing
})

redis.on("connect", () => {
    logger.info("Connected to Redis successfully")
})

redis.on("error", (err) => {
    logger.error("Redis connection error", { error: err.message })
})

module.exports = redis

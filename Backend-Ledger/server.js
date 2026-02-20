require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/db")
const { logger } = require("./src/config/logger")

// Start the BullMQ workers so they begin processing
// queued jobs as soon as the server boots.
require("./src/workers/webhook.worker")
require("./src/workers/reconciliation.worker")

connectToDB()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`)
})
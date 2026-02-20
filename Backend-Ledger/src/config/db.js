const mongoose = require("mongoose")
const { logger } = require("./logger")

function connectToDB() {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            logger.info("Server is connected to MongoDB")
        })
        .catch(err => {
            logger.error("Error connecting to MongoDB", { error: err.message })
            process.exit(1)
        })
}

module.exports = connectToDB
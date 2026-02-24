const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const session = require("express-session")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")
const passport = require("./config/passport")
const correlationIdMiddleware = require("./middlewares/correlationId.middleware")
const { logger } = require("./config/logger")

const app = express()

/**
 * Configure CORS to allow requests from frontend and Docker environments.
 * Credentials enabled for JWT cookies.
 */
app.use(cors({
  origin: true,   // reflects request origin
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json())
app.use(cookieParser())

// Express Session for Passport state management
app.use(session({
    secret: process.env.JWT_SECRET_KEY || "session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set true behind HTTPS
}))

app.use(passport.initialize())
app.use(passport.session())

// Attach unique correlation ID to each request for logging
app.use(correlationIdMiddleware)

// Swagger UI documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Banking Ledger API Docs",
    customCss: ".swagger-ui .topbar { display: none }"
}))

/**
 * Routes
 */
const authRouter = require("./routes/auth.routes")
const googleAuthRouter = require("./routes/googleAuth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.route")
const webhookRouter = require("./routes/webhook.routes")
const ledgerRouter = require("./routes/ledger.routes")
const reconcileRouter = require("./routes/reconcile.routes")

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})

app.use("/api/auth", authRouter)
app.use("/api/auth", googleAuthRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/webhooks", webhookRouter)
app.use("/api/ledger", ledgerRouter)
app.use("/api/reconcile", reconcileRouter)

module.exports = app
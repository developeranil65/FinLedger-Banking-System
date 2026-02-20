const swaggerJsdoc = require("swagger-jsdoc")

/**
 * Swagger / OpenAPI Configuration
 * ---------------------------------
 * WHY SWAGGER OVER A PLAIN TEXT FILE? (interview-ready)
 *
 *   A plain text API doc (or a Google Doc) is:
 *     ✗ Static — gets stale the moment code changes
 *     ✗ Not executable — can't send test requests from it
 *     ✗ Not machine-readable — can't generate client SDKs
 *
 *   Swagger / OpenAPI is:
 *     ✓ Interactive — built-in "Try it out" button sends real requests
 *     ✓ Standardized — follows the OpenAPI 3.0 spec, parseable by tools
 *     ✓ Auto-generates client SDKs (TypeScript, Python, Java)
 *     ✓ Integrated with CI/CD — can validate that code matches the spec
 *     ✓ Self-hosted — lives at /api-docs alongside the API itself
 *
 *   For recruiters and hiring managers: Swagger docs demonstrate that
 *   you understand API-first design, which is a hallmark of senior
 *   backend engineers.
 */

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Banking Ledger API",
            version: "1.0.0",
            description:
                "A production-grade double-entry banking ledger with atomic transactions, " +
                "immutable audit trails, Redis caching, webhook integrations, and a reconciliation engine.",
            contact: {
                name: "Developer",
                email: "developeranil65@gmail.com"
            }
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development"
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT token obtained from POST /api/auth/login"
                }
            }
        },
        tags: [
            { name: "Auth", description: "User registration, login, and logout" },
            { name: "Accounts", description: "Bank account management" },
            { name: "Transactions", description: "Fund transfers with ACID guarantees" },
            { name: "Webhooks", description: "Webhook subscription management" }
        ],

        // ── Inline path definitions ──
        // (These can alternatively be placed as JSDoc comments in route files,
        //  but inline definitions are more portable and easier to maintain
        //  for a project of this size.)

        paths: {
            // ═══════════════════════ AUTH ═══════════════════════

            "/api/auth/register": {
                post: {
                    tags: ["Auth"],
                    summary: "Register — sends 6-digit OTP to the provided email",
                    description:
                        "Step 1 of 2: Creates a PendingUser record with a hashed OTP. " +
                        "The user must verify the OTP via POST /api/auth/verify-otp to complete registration. " +
                        "PendingUser records auto-expire after 10 minutes.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["email", "password", "name"],
                                    properties: {
                                        email: { type: "string", format: "email", example: "john@example.com" },
                                        password: { type: "string", minLength: 6, example: "secret123" },
                                        name: { type: "string", example: "John Doe" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: "OTP sent to email",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            message: { type: "string", example: "OTP sent to your email. Please verify to complete registration." },
                                            email: { type: "string", example: "john@example.com" }
                                        }
                                    }
                                }
                            }
                        },
                        422: { description: "User already exists" }
                    }
                }
            },

            "/api/auth/verify-otp": {
                post: {
                    tags: ["Auth"],
                    summary: "Verify OTP and complete registration",
                    description:
                        "Step 2 of 2: Verifies the 6-digit OTP, creates the real user, " +
                        "and returns the JWT token. The PendingUser record is deleted on success.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["email", "otp"],
                                    properties: {
                                        email: { type: "string", format: "email", example: "john@example.com" },
                                        otp: { type: "string", minLength: 6, maxLength: 6, example: "482019" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: "User created — JWT returned",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            user: {
                                                type: "object",
                                                properties: {
                                                    _id: { type: "string" },
                                                    email: { type: "string" },
                                                    name: { type: "string" }
                                                }
                                            },
                                            token: { type: "string", description: "JWT token" }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: "Invalid OTP or expired registration" }
                    }
                }
            },

            "/api/auth/resend-otp": {
                post: {
                    tags: ["Auth"],
                    summary: "Resend a new OTP for a pending registration",
                    description:
                        "Generates a new 6-digit OTP for an existing pending registration " +
                        "and sends it to the user's email. The expiry timer resets to 10 minutes.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["email"],
                                    properties: {
                                        email: { type: "string", format: "email", example: "john@example.com" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: "New OTP sent to email" },
                        400: { description: "No pending registration found" }
                    }
                }
            },

            "/api/auth/login": {
                post: {
                    tags: ["Auth"],
                    summary: "Login and receive JWT (rate limited: 10 req / 15 min)",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["email", "password"],
                                    properties: {
                                        email: { type: "string", format: "email", example: "john@example.com" },
                                        password: { type: "string", example: "secret123" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: "Login successful — JWT returned" },
                        401: { description: "Invalid email or password" },
                        429: { description: "Too many login attempts — rate limited" }
                    }
                }
            },

            "/api/auth/logout": {
                post: {
                    tags: ["Auth"],
                    summary: "Logout and blacklist the current JWT",
                    responses: {
                        200: { description: "Logged out successfully" }
                    }
                }
            },

            // ═══════════════════════ ACCOUNTS ═══════════════════════

            "/api/accounts": {
                post: {
                    tags: ["Accounts"],
                    summary: "Create a new bank account",
                    security: [{ BearerAuth: [] }],
                    responses: {
                        201: { description: "Account created" },
                        401: { description: "Unauthorized" }
                    }
                },
                get: {
                    tags: ["Accounts"],
                    summary: "List all accounts for the logged-in user",
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: "Array of accounts" },
                        401: { description: "Unauthorized" }
                    }
                }
            },

            "/api/accounts/balance/{accountId}": {
                get: {
                    tags: ["Accounts"],
                    summary: "Get account balance (served from Redis cache when available)",
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: "accountId",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "MongoDB ObjectId of the account"
                        }
                    ],
                    responses: {
                        200: {
                            description: "Balance retrieved",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            accountId: { type: "string" },
                                            balance: { type: "number", example: 5000 }
                                        }
                                    }
                                }
                            }
                        },
                        404: { description: "Account not found" }
                    }
                }
            },

            "/api/accounts/{accountId}": {
                delete: {
                    tags: ["Accounts"],
                    summary: "Close an account (soft delete — ledger entries preserved)",
                    description:
                        "Sets account status to CLOSED. The account must belong to the authenticated user " +
                        "and must have a zero balance. All ledger entries and transaction history remain " +
                        "available for audit purposes — nothing is hard-deleted.",
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: "accountId",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "MongoDB ObjectId of the account to close"
                        }
                    ],
                    responses: {
                        200: {
                            description: "Account closed successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            message: { type: "string", example: "Account closed successfully. Ledger entries remain available for audit." },
                                            account: {
                                                type: "object",
                                                properties: {
                                                    _id: { type: "string" },
                                                    status: { type: "string", example: "CLOSED" },
                                                    closedAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: "Account already closed or has non-zero balance" },
                        404: { description: "Account not found" }
                    }
                }
            },

            // ═══════════════════════ TRANSACTIONS ═══════════════════════

            "/api/transactions": {
                post: {
                    tags: ["Transactions"],
                    summary: "Transfer funds between accounts (ACID, rate limited: 30 req / 15 min)",
                    description:
                        "Executes the 10-step transfer flow: validate → check idempotency → " +
                        "verify account status → check balance → create PENDING transaction → " +
                        "DEBIT sender → CREDIT receiver → mark COMPLETED → commit session → " +
                        "bust cache + reconcile + webhook + email.",
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["fromAccount", "toAccount", "amount", "idempotencyKey"],
                                    properties: {
                                        fromAccount: { type: "string", description: "Sender account ObjectId", example: "665a1b2c3d4e5f6a7b8c9d01" },
                                        toAccount: { type: "string", description: "Receiver account ObjectId", example: "665a1b2c3d4e5f6a7b8c9d02" },
                                        amount: { type: "number", minimum: 0, description: "Amount to transfer", example: 500 },
                                        idempotencyKey: { type: "string", description: "Unique key to prevent duplicate transactions", example: "txn-abc-123-unique" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: "Transaction completed successfully" },
                        200: { description: "Transaction already processed (idempotent)" },
                        400: { description: "Validation error, insufficient balance, or inactive account" },
                        429: { description: "Rate limited — too many transactions" }
                    }
                }
            },

            "/api/transactions/system/initial-funds": {
                post: {
                    tags: ["Transactions"],
                    summary: "Seed an account with initial funds (system user only)",
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["toAccount", "amount", "idempotencyKey"],
                                    properties: {
                                        toAccount: { type: "string", example: "665a1b2c3d4e5f6a7b8c9d02" },
                                        amount: { type: "number", example: 10000 },
                                        idempotencyKey: { type: "string", example: "seed-abc-123" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: "Initial funds deposited" },
                        400: { description: "Invalid account" }
                    }
                }
            },

            // ═══════════════════════ WEBHOOKS ═══════════════════════

            "/api/webhooks": {
                post: {
                    tags: ["Webhooks"],
                    summary: "Register a webhook subscription",
                    description:
                        "Creates a new webhook. The response includes a `secretKey` (UUID v4) " +
                        "which is shown ONLY once. The client uses this key to verify HMAC-SHA256 " +
                        "signatures on incoming webhook payloads.",
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["targetUrl"],
                                    properties: {
                                        targetUrl: { type: "string", format: "uri", example: "https://your-server.com/webhooks/receive" },
                                        event: { type: "string", enum: ["TRANSACTION_COMPLETED"], default: "TRANSACTION_COMPLETED" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: "Webhook created — secretKey is in the response (save it!)",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            message: { type: "string" },
                                            subscription: {
                                                type: "object",
                                                properties: {
                                                    _id: { type: "string" },
                                                    targetUrl: { type: "string" },
                                                    event: { type: "string" },
                                                    secretKey: { type: "string", description: "HMAC key — shown ONLY on creation" },
                                                    isActive: { type: "boolean" },
                                                    createdAt: { type: "string", format: "date-time" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        400: { description: "targetUrl is required" }
                    }
                },
                get: {
                    tags: ["Webhooks"],
                    summary: "List all your webhook subscriptions",
                    security: [{ BearerAuth: [] }],
                    responses: {
                        200: { description: "Array of subscriptions (secretKey excluded)" }
                    }
                }
            },

            "/api/webhooks/{id}": {
                delete: {
                    tags: ["Webhooks"],
                    summary: "Deactivate a webhook (soft delete)",
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "Webhook subscription ObjectId"
                        }
                    ],
                    responses: {
                        200: { description: "Webhook deactivated" },
                        404: { description: "Webhook not found" }
                    }
                }
            }
        }
    },

    // We define everything inline above, so apis is empty
    apis: []
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec


const express = require("express")
const authController = require("../controllers/auth.controller")
const { authLimiter } = require("../middlewares/rateLimiter.middleware")

const router = express.Router()


/* POST /api/auth/register — sends OTP to email */
router.post("/register", authController.userRegisterController)

/* POST /api/auth/verify-otp — verifies OTP and creates user */
router.post("/verify-otp", authController.verifyOtpController)

/* POST /api/auth/resend-otp — resends a new OTP */
router.post("/resend-otp", authController.resendOtpController)

/* POST /api/auth/login — rate limited to prevent brute-force attacks */
router.post("/login", authLimiter, authController.userLoginController)

/**
 * - POST /api/auth/logout
 */
router.post("/logout", authController.userLogoutController)



module.exports = router
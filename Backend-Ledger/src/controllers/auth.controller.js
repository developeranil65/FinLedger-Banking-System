const userModel = require("../models/user.model")
const PendingUser = require("../models/pendingUser.model")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")


/**
 * Generate a 6-digit numeric OTP.
 * @returns {string} 6-digit OTP
 */
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}


/**
 * Step 1: Register a new user (collect credentials, send OTP)
 * Creates a PendingUser that expires in 10 minutes.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body

        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.status(422).json({
                message: "User already exists with this email.",
                status: "failed"
            })
        }

        const otp = generateOtp()
        const hashedPassword = await bcrypt.hash(password, 10)
        const hashedOtp = await bcrypt.hash(otp, 10)

        await PendingUser.findOneAndUpdate(
            { email },
            {
                email,
                name,
                hashedPassword,
                otp: hashedOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            },
            { upsert: true, new: true }
        )

        emailService.sendOtpEmail(email, name, otp)

        return res.status(200).json({
            message: "OTP sent to your email. Please verify to complete registration.",
            email
        })
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Registration failed"
        })
    }
}


/**
 * Step 2: Verify OTP and create the real user.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyOtpController(req, res) {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            })
        }

        const pending = await PendingUser.findOne({ email })
        if (!pending) {
            return res.status(400).json({
                message: "OTP has expired or no pending registration found. Please register again."
            })
        }

        const isValid = await pending.compareOtp(otp)
        if (!isValid) {
            return res.status(400).json({
                message: "Invalid OTP. Please check and try again."
            })
        }

        const user = new userModel({
            email: pending.email,
            name: pending.name,
            password: pending.hashedPassword
        })

        // Skip the pre-save hash since the password is already hashed
        user.$locals.skipPasswordHash = true
        await user.save()

        await PendingUser.deleteOne({ email })

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "3d" }
        )

        res.cookie("token", token)

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })

        emailService.sendRegistrationEmail(user.email, user.name)

    } catch (err) {
        return res.status(500).json({
            message: err.message || "OTP verification failed"
        })
    }
}


/**
 * Resend OTP for an existing pending registration.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function resendOtpController(req, res) {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            })
        }

        const pending = await PendingUser.findOne({ email })
        if (!pending) {
            return res.status(400).json({
                message: "No pending registration found. Please register again."
            })
        }

        const otp = generateOtp()
        const hashedOtp = await bcrypt.hash(otp, 10)

        pending.otp = hashedOtp
        pending.expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await pending.save()

        emailService.sendOtpEmail(pending.email, pending.name, otp)

        return res.status(200).json({
            message: "A new OTP has been sent to your email."
        })
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Failed to resend OTP"
        })
    }
}


/**
 * Login a user.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function userLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")

    if (!user) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}


/**
 * Logout a user.
 * Adds token to blacklist and clears cookie.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }

    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}


module.exports = {
    userRegisterController,
    verifyOtpController,
    resendOtpController,
    userLoginController,
    userLogoutController
}
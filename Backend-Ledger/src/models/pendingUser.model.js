const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

/**
 * PendingUser Model
 * ─────────────────
 * Temporary storage for users who have registered but not yet verified
 * their email via OTP.
 *
 * WHY a separate model?
 *   We don't want unverified users in the main `users` collection.
 *   This keeps the users table clean — every user in it has a verified email.
 *
 * WHY TTL index?
 *   MongoDB automatically deletes documents when `expiresAt` passes.
 *   No manual cleanup needed — stale OTPs vanish on their own.
 *
 * WHY hash the OTP?
 *   If the database is compromised, plaintext OTPs could be used to
 *   hijack pending registrations. Hashing makes them unusable.
 */
const pendingUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        index: { expires: 0 } // TTL index — MongoDB auto-deletes at expiresAt
    }
}, {
    timestamps: true
})


/**
 * Compare a plaintext OTP against the stored hash
 */
pendingUserSchema.methods.compareOtp = async function (plainOtp) {
    return await bcrypt.compare(plainOtp, this.otp)
}


const PendingUser = mongoose.model("PendingUser", pendingUserSchema)

module.exports = PendingUser

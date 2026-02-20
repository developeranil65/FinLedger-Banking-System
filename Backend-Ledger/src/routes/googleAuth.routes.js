const { Router } = require("express")
const passport = require("passport")
const jwt = require("jsonwebtoken")

const googleAuthRouter = Router()

/**
 * GET /api/auth/google
 * Redirects the user to Google's consent screen.
 * The `scope` defines what data we request:
 *   - profile: name, avatar
 *   - email: email address
 */
googleAuthRouter.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
)

/**
 * GET /api/auth/google/callback
 * Google redirects here after user grants permission.
 * Passport exchanges the authorization code for a token,
 * runs the verify callback, and populates req.user.
 *
 * We then issue our own JWT (same as password login) and
 * redirect the user to the frontend with the token.
 */
googleAuthRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "http://localhost:5173/login?error=auth_failed"
    }),
    (req, res) => {
        // Issue JWT — same as regular login
        const token = jwt.sign(
            { userId: req.user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "3d" }
        )

        res.cookie("token", token)

        // Redirect to frontend with token
        res.redirect(`http://localhost:5173/?token=${token}`)
    }
)

module.exports = googleAuthRouter

const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const userModel = require("../models/user.model")

/**
 * Passport.js — Google OAuth 2.0 Strategy
 * ─────────────────────────────────────────
 * HOW IT WORKS (interview-ready):
 *
 *   1. User clicks "Login with Google" → redirected to Google consent screen
 *   2. Google sends back an authorization code to /auth/google/callback
 *   3. Passport exchanges the code for an access token (server-to-server)
 *   4. The verify callback below receives the user's profile
 *   5. We find-or-create the user in MongoDB by their googleId
 *   6. The user is serialized into the session (just the _id)
 *
 * WHY PASSPORT?
 *   Passport abstracts OAuth complexity (PKCE, token refresh, etc.)
 *   into a simple strategy pattern.  You configure once and get
 *   Google, GitHub, Facebook, etc. with identical middleware.
 */

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback"
        },  
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists by googleId
                let user = await userModel.findOne({ googleId: profile.id })

                if (!user) {
                    // Check if email already exists (registered via password)
                    user = await userModel.findOne({
                        email: profile.emails[0].value
                    })

                    if (user) {
                        // Link Google account to existing user
                        user.googleId = profile.id
                        await user.save()
                    } else {
                        // Create brand new user
                        user = await userModel.create({
                            googleId: profile.id,
                            email: profile.emails[0].value,
                            name: profile.displayName,
                            password: `google-${profile.id}-${Date.now()}`
                        })
                    }
                }

                return done(null, user)
            } catch (err) {
                return done(err, null)
            }
        }
    )
)

// Serialize: store only user._id in the session
passport.serializeUser((user, done) => {
    done(null, user._id)
})

// Deserialize: fetch user from DB on each request
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id)
        done(null, user)
    } catch (err) {
        done(err, null)
    }
})

module.exports = passport

import { useState, useEffect } from "react"
import api from "../services/api"

/**
 * useAuth Hook
 * ─────────────
 * Manages authentication state: register (OTP flow), login, logout.
 * Stores the JWT in localStorage and the user object in state.
 *
 * REGISTRATION FLOW (2-step):
 *   1. register() → sends OTP → sets pendingEmail
 *   2. verifyOtp() → verifies OTP → creates user + JWT
 */
export function useAuth() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user")
        return saved ? JSON.parse(saved) : null
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [pendingEmail, setPendingEmail] = useState(null)

    // Check for token in URL (Google OAuth callback)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get("token")
        if (token) {
            localStorage.setItem("token", token)
            window.history.replaceState({}, "", "/")
            fetchProfile(token)
        }
    }, [])

    async function fetchProfile(token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]))
            setUser({ _id: payload.userId })
            localStorage.setItem("user", JSON.stringify({ _id: payload.userId }))
        } catch {
            // ignore
        }
    }

    /**
     * Step 1: Register — sends OTP to email
     * Sets pendingEmail so the UI can show the OTP input screen
     */
    async function register(name, email, password) {
        setLoading(true)
        setError(null)
        try {
            await api.post("/auth/register", { name, email, password })
            setPendingEmail(email)
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed"
            setError(msg)
            throw err
        } finally {
            setLoading(false)
        }
    }

    /**
     * Step 2: Verify the 6-digit OTP — creates user + returns JWT
     */
    async function verifyOtp(email, otp) {
        setLoading(true)
        setError(null)
        try {
            const res = await api.post("/auth/verify-otp", { email, otp })
            const { user: userData, token } = res.data
            localStorage.setItem("token", token)
            localStorage.setItem("user", JSON.stringify(userData))
            setUser(userData)
            setPendingEmail(null)
            return userData
        } catch (err) {
            const msg = err.response?.data?.message || "OTP verification failed"
            setError(msg)
            throw err
        } finally {
            setLoading(false)
        }
    }

    /**
     * Resend OTP for the pending registration
     */
    async function resendOtp(email) {
        setLoading(true)
        setError(null)
        try {
            await api.post("/auth/resend-otp", { email })
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to resend OTP"
            setError(msg)
            throw err
        } finally {
            setLoading(false)
        }
    }

    /**
     * Clear pending registration (go back to register form)
     */
    function cancelOtp() {
        setPendingEmail(null)
        setError(null)
    }

    async function login(email, password) {
        setLoading(true)
        setError(null)
        try {
            const res = await api.post("/auth/login", { email, password })
            const { user: userData, token } = res.data
            localStorage.setItem("token", token)
            localStorage.setItem("user", JSON.stringify(userData))
            setUser(userData)
            return userData
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed"
            setError(msg)
            throw err
        } finally {
            setLoading(false)
        }
    }

    function logout() {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setUser(null)
    }

    return {
        user,
        loading,
        error,
        pendingEmail,
        login,
        register,
        verifyOtp,
        resendOtp,
        cancelOtp,
        logout
    }
}

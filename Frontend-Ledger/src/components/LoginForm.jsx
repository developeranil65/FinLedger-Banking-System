import { useState, useRef, useEffect } from "react"

/**
 * Login/Register and OTP Verification Component.
 */
export default function LoginForm({
    onLogin,
    onRegister,
    onVerifyOtp,
    onResendOtp,
    onCancelOtp,
    pendingEmail,
    loading,
    error
}) {
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [showPass, setShowPass] = useState(false)

    // OTP state
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const inputRefs = useRef([])
    const [resendCooldown, setResendCooldown] = useState(0)

    // Start cooldown timer on mount of OTP screen
    useEffect(() => {
        if (pendingEmail) {
            setResendCooldown(60)
        }
    }, [pendingEmail])

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [resendCooldown])

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            if (isRegister) {
                await onRegister(name, email, password)
            } else {
                await onLogin(email, password)
            }
        } catch {
            // error handled by hook
        }
    }

    // OTP Handlers

    function handleOtpChange(index, value) {
        // Only accept digits
        if (value && !/^\d$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    function handleOtpKeyDown(index, e) {
        // Backspace goes to previous input
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    function handleOtpPaste(e) {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
        if (!pasted) return

        const newOtp = [...otp]
        for (let i = 0; i < 6; i++) {
            newOtp[i] = pasted[i] || ""
        }
        setOtp(newOtp)

        // Focus the last filled or next empty input
        const focusIdx = Math.min(pasted.length, 5)
        inputRefs.current[focusIdx]?.focus()
    }

    async function handleVerifyOtp(e) {
        e.preventDefault()
        const code = otp.join("")
        if (code.length !== 6) return
        try {
            await onVerifyOtp(pendingEmail, code)
        } catch {
            // error handled by hook
        }
    }

    async function handleResendOtp() {
        try {
            await onResendOtp(pendingEmail)
            setResendCooldown(60)
            setOtp(["", "", "", "", "", ""])
        } catch {
            // error handled by hook
        }
    }

    function handleBackToRegister() {
        setOtp(["", "", "", "", "", ""])
        onCancelOtp()
    }

    // OTP Verification Screen
    if (pendingEmail) {
        return (
            <div
                className="flex items-center justify-center min-h-screen"
                style={{
                    background: "linear-gradient(135deg, var(--color-bg-primary) 0%, #0a0f1a 50%, #0d1321 100%)"
                }}
            >
                <div style={{ width: "100%", maxWidth: "480px", padding: "0 24px" }}>
                    {/* Brand */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold tracking-tight mb-3" style={{ color: "var(--color-text-primary)" }}>
                            FinLedger
                        </h1>
                        <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
                            Secure banking infrastructure
                        </p>
                    </div>

                    {/* OTP Card */}
                    <div
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "24px",
                            padding: "48px 44px",
                            backdropFilter: "blur(20px)"
                        }}
                    >
                        <div className="text-center mb-8">
                            {/* Lock icon */}
                            <div
                                style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "16px",
                                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                    boxShadow: "0 8px 24px rgba(79,110,247,0.3)"
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h2
                                style={{
                                    fontSize: "22px",
                                    fontWeight: 700,
                                    color: "var(--color-text-primary)",
                                    marginBottom: "8px"
                                }}
                            >
                                Verify Your Email
                            </h2>
                            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                                We sent a 6-digit code to<br />
                                <span style={{ fontWeight: 600, color: "var(--color-primary-light)" }}>{pendingEmail}</span>
                            </p>
                        </div>

                        {/* Error display */}
                        {error && (
                            <div
                                className="animate-fade-in"
                                style={{
                                    marginBottom: "20px",
                                    padding: "14px 20px",
                                    borderRadius: "14px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "var(--color-danger)",
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.2)"
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* OTP Input */}
                        <form onSubmit={handleVerifyOtp}>
                            <div
                                className="flex justify-center gap-3"
                                style={{ marginBottom: "32px" }}
                            >
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => inputRefs.current[i] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                        onPaste={i === 0 ? handleOtpPaste : undefined}
                                        autoFocus={i === 0}
                                        style={{
                                            width: "52px",
                                            height: "60px",
                                            borderRadius: "14px",
                                            border: digit
                                                ? "2px solid var(--color-primary)"
                                                : "1px solid var(--color-border)",
                                            background: digit
                                                ? "rgba(79,110,247,0.08)"
                                                : "rgba(0,0,0,0.35)",
                                            color: "var(--color-text-primary)",
                                            fontSize: "24px",
                                            fontWeight: 700,
                                            textAlign: "center",
                                            outline: "none",
                                            transition: "all 0.2s ease",
                                            caretColor: "var(--color-primary)"
                                        }}
                                        onFocus={e => {
                                            e.target.style.borderColor = "var(--color-primary)"
                                            e.target.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.12)"
                                        }}
                                        onBlur={e => {
                                            e.target.style.borderColor = digit ? "var(--color-primary)" : "var(--color-border)"
                                            e.target.style.boxShadow = "none"
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Verify button */}
                            <button
                                type="submit"
                                disabled={loading || otp.join("").length !== 6}
                                className="btn-primary w-full"
                                style={{ marginBottom: "16px" }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <span
                                            className="w-4 h-4 border-2 rounded-full animate-spin"
                                            style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                                        />
                                        Verifying...
                                    </span>
                                ) : (
                                    "Verify and Create Account"
                                )}
                            </button>

                            {/* Resend / Back actions */}
                            <div className="flex items-center justify-between" style={{ marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={handleBackToRegister}
                                    className="cursor-pointer text-sm font-medium transition-colors"
                                    style={{ color: "var(--color-text-secondary)" }}
                                    onMouseEnter={e => e.currentTarget.style.color = "var(--color-text-primary)"}
                                    onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0 || loading}
                                    className="cursor-pointer text-sm font-semibold transition-colors"
                                    style={{
                                        color: resendCooldown > 0 ? "var(--color-text-muted)" : "var(--color-primary-light)",
                                        opacity: resendCooldown > 0 ? 0.6 : 1
                                    }}
                                    onMouseEnter={e => { if (resendCooldown <= 0) e.currentTarget.style.color = "var(--color-primary)" }}
                                    onMouseLeave={e => { if (resendCooldown <= 0) e.currentTarget.style.color = "var(--color-primary-light)" }}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center mt-10" style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
                        Code expires in 10 minutes
                    </p>
                </div>
            </div>
        )
    }

    // Login / Register Form
    return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{
                background: "linear-gradient(135deg, var(--color-bg-primary) 0%, #0a0f1a 50%, #0d1321 100%)"
            }}
        >
            <div style={{ width: "100%", maxWidth: "480px", padding: "0 24px" }}>
                {/* Brand header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold tracking-tight mb-3" style={{ color: "var(--color-text-primary)" }}>
                        FinLedger
                    </h1>
                    <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
                        Secure banking infrastructure
                    </p>
                </div>

                {/* Card */}
                <div
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "24px",
                        padding: "48px 44px",
                        backdropFilter: "blur(20px)"
                    }}
                >
                    {/* Tab switcher */}
                    <div
                        className="flex mb-12"
                        style={{ background: "rgba(0,0,0,0.35)", borderRadius: "14px", padding: "5px" }}
                    >
                        {["Sign In", "Register"].map((tab, i) => (
                            <button
                                key={tab}
                                onClick={() => setIsRegister(i === 1)}
                                className="flex-1 text-sm font-semibold transition-all duration-250 cursor-pointer"
                                style={{
                                    padding: "14px 20px",
                                    borderRadius: "10px",
                                    ...(isRegister === (i === 1) ? {
                                        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                                        color: "#fff",
                                        boxShadow: "0 4px 16px rgba(79,110,247,0.4)"
                                    } : {
                                        color: "var(--color-text-secondary)",
                                        background: "transparent"
                                    })
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Error display */}
                    {error && (
                        <div
                            className="animate-fade-in"
                            style={{
                                marginBottom: "24px",
                                padding: "14px 20px",
                                borderRadius: "14px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "var(--color-danger)",
                                background: "rgba(239,68,68,0.08)",
                                border: "1px solid rgba(239,68,68,0.2)"
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {/* Name (register only) */}
                            {isRegister && (
                                <div>
                                    <label className="section-label">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="input-field"
                                    />
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="section-label">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="input-field"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="section-label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="input-field"
                                        style={{ paddingRight: "70px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        {showPass ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                            style={{ marginTop: "36px" }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <span
                                        className="w-4 h-4 border-2 rounded-full animate-spin"
                                        style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                                    />
                                    Processing...
                                </span>
                            ) : (
                                isRegister ? "Create Account" : "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4" style={{ margin: "28px 0" }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>or</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
                    </div>

                    {/* Google OAuth */}
                    <a
                        href="/api/auth/google"
                        className="flex items-center justify-center gap-3 w-full cursor-pointer transition-all"
                        style={{
                            padding: "14px 20px",
                            borderRadius: "14px",
                            border: "1px solid var(--color-border)",
                            background: "rgba(0,0,0,0.2)",
                            color: "var(--color-text-primary)",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.2)"
                            e.currentTarget.style.borderColor = "var(--color-border)"
                        }}
                    >
                        {/* Google "G" icon */}
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Continue with Google
                    </a>
                </div>

                {/* Footer note */}
                <p className="text-center mt-10" style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
                    {isRegister ? "Already have an account? " : "Don't have an account? "}
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        className="font-semibold cursor-pointer transition-colors"
                        style={{ color: "var(--color-primary-light)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--color-primary-light)"}
                    >
                        {isRegister ? "Sign In" : "Create one"}
                    </button>
                </p>
            </div>
        </div>
    )
}

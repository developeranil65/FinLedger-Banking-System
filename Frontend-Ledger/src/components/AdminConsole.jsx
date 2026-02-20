import { useState, useEffect, useCallback } from "react"
import api from "../services/api"

export default function AdminConsole({ selectedAccount }) {
    const [reconcileResult, setReconcileResult] = useState(null)
    const [reconcileLoading, setReconcileLoading] = useState(false)
    const [webhooks, setWebhooks] = useState([])
    const [webhookLoading, setWebhookLoading] = useState(false)

    // Create webhook form state
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newTargetUrl, setNewTargetUrl] = useState("")
    const [newEvent, setNewEvent] = useState("TRANSACTION_COMPLETED")
    const [creating, setCreating] = useState(false)
    const [createResult, setCreateResult] = useState(null)

    // Delete state
    const [deletingId, setDeletingId] = useState(null)

    const fetchWebhooks = useCallback(async () => {
        setWebhookLoading(true)
        try {
            const res = await api.get("/webhooks")
            setWebhooks(res.data.subscriptions || [])
        } catch {
            setWebhooks([])
        } finally {
            setWebhookLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWebhooks()
    }, [fetchWebhooks])

    async function handleReconcile() {
        if (!selectedAccount?._id) return
        setReconcileLoading(true)
        setReconcileResult(null)
        try {
            const res = await api.post(`/reconcile/${selectedAccount._id}`)
            setReconcileResult(res.data)
        } catch (err) {
            setReconcileResult({
                status: "ERROR",
                message: err.response?.data?.message || "Reconciliation failed"
            })
        } finally {
            setReconcileLoading(false)
        }
    }

    async function handleCreateWebhook(e) {
        e.preventDefault()
        if (!newTargetUrl.trim()) return
        setCreating(true)
        setCreateResult(null)
        try {
            const res = await api.post("/webhooks", {
                targetUrl: newTargetUrl.trim(),
                event: newEvent
            })
            setCreateResult({
                type: "success",
                message: "Webhook created successfully",
                secretKey: res.data.subscription?.secretKey
            })
            setNewTargetUrl("")
            fetchWebhooks()
        } catch (err) {
            setCreateResult({
                type: "error",
                message: err.response?.data?.message || "Failed to create webhook"
            })
        } finally {
            setCreating(false)
        }
    }

    async function handleDeleteWebhook(id) {
        setDeletingId(id)
        try {
            await api.delete(`/webhooks/${id}`)
            fetchWebhooks()
        } catch {
            // Silently handle — webhook list will refresh regardless
        } finally {
            setDeletingId(null)
        }
    }

    const statusStyles = {
        OK: { color: "var(--color-success)", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)" },
        CACHE_MISS: { color: "var(--color-warning)", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)" },
        DRIFT_DETECTED: { color: "var(--color-danger)", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
        ERROR: { color: "var(--color-danger)", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

            {/* Header */}
            <div>
                <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                    Admin Console
                </h2>
                <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", marginTop: "6px" }}>
                    System monitoring and data integrity tools
                </p>
            </div>

            {/* ─── Reconciliation Engine ─── */}
            <div className="card" style={{ padding: "40px 44px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <div>
                        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                            Reconciliation Engine
                        </h3>
                        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
                            Compare Redis cache against MongoDB ledger to detect data drift
                        </p>
                    </div>
                    <button
                        onClick={handleReconcile}
                        disabled={reconcileLoading || !selectedAccount}
                        className="btn-primary"
                        style={{
                            background: reconcileLoading || !selectedAccount
                                ? "rgba(59,130,246,0.3)"
                                : "linear-gradient(135deg, var(--color-info), #2563eb)",
                            boxShadow: reconcileLoading || !selectedAccount
                                ? "none"
                                : "0 6px 20px rgba(59,130,246,0.25)"
                        }}
                    >
                        {reconcileLoading ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span className="animate-spin" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                                Checking...
                            </span>
                        ) : "Check Integrity"}
                    </button>
                </div>

                {reconcileResult && (() => {
                    const styles = statusStyles[reconcileResult.status] || statusStyles.ERROR
                    return (
                        <div
                            style={{
                                padding: "28px 32px",
                                borderRadius: "16px",
                                background: styles.bg,
                                border: `1px solid ${styles.border}`
                            }}
                        >
                            <p style={{ fontSize: "14px", fontWeight: 700, color: styles.color, marginBottom: "12px" }}>
                                {reconcileResult.status}
                            </p>
                            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
                                {reconcileResult.message}
                            </p>

                            {reconcileResult.cachedBalance !== undefined && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                                    <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
                                        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "10px" }}>Cached Balance</p>
                                        <p style={{ fontSize: "15px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                            ₹{reconcileResult.cachedBalance !== null
                                                ? reconcileResult.cachedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                                                : "—"
                                            }
                                        </p>
                                    </div>
                                    <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
                                        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "10px" }}>Ledger Balance</p>
                                        <p style={{ fontSize: "15px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                            ₹{reconcileResult.ledgerBalance?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "—"}
                                        </p>
                                    </div>
                                    {reconcileResult.delta !== undefined && reconcileResult.delta !== 0 && (
                                        <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
                                            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "10px" }}>Delta</p>
                                            <p style={{ fontSize: "15px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-danger)" }}>
                                                {reconcileResult.delta > 0 ? "+" : ""}₹{reconcileResult.delta?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })()}
            </div>

            {/* ─── Webhook Monitor ─── */}
            <div className="card" style={{ padding: "40px 44px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <div>
                        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                            Webhook Monitor
                        </h3>
                        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
                            Manage webhook subscriptions for outgoing notifications
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            onClick={fetchWebhooks}
                            disabled={webhookLoading}
                            className="btn-secondary"
                            style={{ opacity: webhookLoading ? 0.5 : 1 }}
                        >
                            Refresh
                        </button>
                        <button
                            onClick={() => { setShowCreateForm(!showCreateForm); setCreateResult(null) }}
                            className="btn-primary"
                        >
                            {showCreateForm ? "Cancel" : "New Webhook"}
                        </button>
                    </div>
                </div>

                {/* ── Create Webhook Form ── */}
                {showCreateForm && (
                    <div
                        className="animate-fade-in"
                        style={{
                            padding: "32px 36px",
                            marginBottom: "28px",
                            borderRadius: "16px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--color-border)"
                        }}
                    >
                        <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "24px" }}>
                            Create Webhook Subscription
                        </p>

                        <form onSubmit={handleCreateWebhook}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div>
                                    <label className="section-label">Target URL</label>
                                    <input
                                        type="url"
                                        value={newTargetUrl}
                                        onChange={(e) => setNewTargetUrl(e.target.value)}
                                        placeholder="https://your-server.com/webhook"
                                        required
                                        className="input-field"
                                        style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
                                    />
                                </div>

                                <div>
                                    <label className="section-label">Event Type</label>
                                    <select
                                        value={newEvent}
                                        onChange={(e) => setNewEvent(e.target.value)}
                                        className="input-field"
                                        style={{ cursor: "pointer" }}
                                    >
                                        <option value="TRANSACTION_COMPLETED">TRANSACTION_COMPLETED</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
                                <button
                                    type="submit"
                                    disabled={creating || !newTargetUrl.trim()}
                                    className="btn-primary"
                                    style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        background: creating || !newTargetUrl.trim()
                                            ? "rgba(79,110,247,0.3)"
                                            : "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))"
                                    }}
                                >
                                    {creating ? (
                                        <>
                                            <span className="animate-spin" style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                                            Creating...
                                        </>
                                    ) : "Create Webhook"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateForm(false); setCreateResult(null) }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>

                        {/* Create result message */}
                        {createResult && (
                            <div
                                className="animate-fade-in"
                                style={{
                                    marginTop: "24px",
                                    padding: "20px 24px",
                                    borderRadius: "14px",
                                    background: createResult.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                                    border: createResult.type === "success" ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.25)"
                                }}
                            >
                                <p style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: createResult.type === "success" ? "var(--color-success)" : "var(--color-danger)",
                                    marginBottom: createResult.secretKey ? "12px" : 0
                                }}>
                                    {createResult.message}
                                </p>

                                {/* Secret key — shown only once */}
                                {createResult.secretKey && (
                                    <div style={{
                                        padding: "16px 20px",
                                        borderRadius: "12px",
                                        background: "rgba(0,0,0,0.3)",
                                        border: "1px solid rgba(234,179,8,0.3)"
                                    }}>
                                        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-warning)", marginBottom: "8px" }}>
                                            Secret Key — Save this now, it will not be shown again
                                        </p>
                                        <code style={{
                                            fontSize: "13px",
                                            fontFamily: "var(--font-mono)",
                                            color: "var(--color-text-primary)",
                                            wordBreak: "break-all"
                                        }}>
                                            {createResult.secretKey}
                                        </code>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Webhook List ── */}
                {webhookLoading && (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        <span className="animate-spin" style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(79,110,247,0.3)", borderTopColor: "var(--color-primary)", borderRadius: "50%", marginRight: "10px", verticalAlign: "middle" }} />
                        <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Loading webhooks...</span>
                    </div>
                )}

                {webhooks.length === 0 && !webhookLoading && (
                    <div style={{ padding: "56px 40px", textAlign: "center", borderRadius: "16px", background: "rgba(255,255,255,0.015)" }}>
                        <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                            No webhook subscriptions found.
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                            Click "New Webhook" above to create one.
                        </p>
                    </div>
                )}

                {webhooks.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {webhooks.map((wh) => (
                            <div
                                key={wh._id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "20px 28px",
                                    borderRadius: "16px",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(26,39,68,0.5)",
                                    opacity: deletingId === wh._id ? 0.5 : 1,
                                    transition: "opacity 0.2s ease"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
                                    <span
                                        style={{
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            flexShrink: 0,
                                            background: wh.isActive ? "var(--color-success)" : "var(--color-text-secondary)",
                                            boxShadow: wh.isActive ? "0 0 8px var(--color-success)" : "none"
                                        }}
                                    />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <p style={{
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            fontFamily: "var(--font-mono)",
                                            color: "var(--color-text-primary)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}>
                                            {wh.targetUrl}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                                                {wh.event}
                                            </span>
                                            {wh.createdAt && (
                                                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                                                    Created {new Date(wh.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, marginLeft: "20px" }}>
                                    <span
                                        className="badge"
                                        style={wh.isActive ? {
                                            background: "rgba(34,197,94,0.08)",
                                            color: "var(--color-success)",
                                            border: "1px solid rgba(34,197,94,0.25)"
                                        } : {
                                            background: "rgba(255,255,255,0.04)",
                                            color: "var(--color-text-secondary)",
                                            border: "1px solid var(--color-border)"
                                        }}
                                    >
                                        {wh.isActive ? "Active" : "Inactive"}
                                    </span>

                                    {wh.isActive && (
                                        <button
                                            onClick={() => handleDeleteWebhook(wh._id)}
                                            disabled={deletingId === wh._id}
                                            style={{
                                                padding: "8px 18px",
                                                borderRadius: "10px",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                cursor: deletingId === wh._id ? "not-allowed" : "pointer",
                                                transition: "all 0.2s ease",
                                                border: "1px solid rgba(239,68,68,0.25)",
                                                background: "rgba(239,68,68,0.06)",
                                                color: "var(--color-danger)"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)" }}
                                        >
                                            {deletingId === wh._id ? "Removing..." : "Deactivate"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

import { useState } from "react"
import api from "../services/api"

export default function TransferForm({ selectedAccount, onTransferComplete }) {
    const [toAccount, setToAccount] = useState("")
    const [amount, setAmount] = useState("")
    const [idempotencyKey, setIdempotencyKey] = useState(generateKey())
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [txnStatus, setTxnStatus] = useState(null)

    function generateKey() { return `txn-${crypto.randomUUID()}` }

    function resetForm() {
        setToAccount(""); setAmount("")
        setIdempotencyKey(generateKey()); setResult(null); setTxnStatus(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!selectedAccount) return
        setLoading(true); setResult(null); setTxnStatus("PENDING")
        try {
            const res = await api.post("/transactions", {
                fromAccount: selectedAccount._id, toAccount,
                amount: parseFloat(amount), idempotencyKey
            })
            setTxnStatus("COMPLETED")
            setResult({ type: "success", message: res.data.message || "Transaction completed!", data: res.data })
            if (onTransferComplete) onTransferComplete()
        } catch (err) {
            setTxnStatus("FAILED")
            setResult({ type: "error", message: err.response?.data?.message || "Transaction failed" })
        } finally {
            setLoading(false)
        }
    }

    const statusConfig = {
        PENDING: { color: "var(--color-warning)", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)", label: "Processing transaction..." },
        COMPLETED: { color: "var(--color-success)", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", label: "Transfer completed" },
        FAILED: { color: "var(--color-danger)", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", label: "Transfer failed" },
    }

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                    Transfer Funds
                </h2>
                <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", marginTop: "6px" }}>
                    Send money between accounts with ACID guarantees
                </p>
            </div>

            <div style={{ maxWidth: "680px" }}>
                {/* Status banner */}
                {txnStatus && (() => {
                    const cfg = statusConfig[txnStatus]
                    return (
                        <div
                            className="animate-fade-in"
                            style={{
                                marginBottom: "32px",
                                padding: "20px 28px",
                                borderRadius: "16px",
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                display: "flex",
                                alignItems: "center",
                                gap: "16px"
                            }}
                        >
                            {txnStatus === "PENDING" && (
                                <span className="animate-spin" style={{ width: "20px", height: "20px", border: `2px solid ${cfg.border}`, borderTopColor: cfg.color, borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
                            )}
                            <div>
                                <p style={{ fontWeight: 600, fontSize: "14px", color: cfg.color }}>{cfg.label}</p>
                                {result && <p style={{ fontSize: "13px", marginTop: "4px", opacity: 0.8, color: cfg.color }}>{result.message}</p>}
                            </div>
                        </div>
                    )
                })()}

                {/* Card */}
                <div className="card" style={{ padding: "40px 44px" }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

                            {/* From account */}
                            <div>
                                <label className="section-label">From Account</label>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "16px 20px",
                                        borderRadius: "14px",
                                        background: "rgba(0,0,0,0.3)",
                                        border: "1px solid var(--color-border)"
                                    }}
                                >
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-success)", boxShadow: "0 0 8px var(--color-success)", flexShrink: 0 }} />
                                    <code style={{ fontSize: "14px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                                        {selectedAccount?._id || "No account selected"}
                                    </code>
                                    <span className="badge" style={{ background: "rgba(79,110,247,0.08)", color: "var(--color-primary-light)", border: "1px solid rgba(79,110,247,0.2)", padding: "4px 12px", fontSize: "11px" }}>
                                        {selectedAccount?.currency || "INR"}
                                    </span>
                                </div>
                            </div>

                            {/* To account */}
                            <div>
                                <label className="section-label">To Account</label>
                                <input
                                    type="text"
                                    value={toAccount}
                                    onChange={(e) => setToAccount(e.target.value)}
                                    placeholder="Recipient account ID"
                                    required
                                    className="input-field"
                                    style={{ fontFamily: "var(--font-mono)" }}
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="section-label">Amount (₹)</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", fontWeight: 500, color: "var(--color-text-secondary)" }}>₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        min="1"
                                        step="0.01"
                                        required
                                        className="input-field"
                                        style={{ paddingLeft: "44px", fontFamily: "var(--font-mono)" }}
                                    />
                                </div>
                            </div>

                            {/* Idempotency key */}
                            <div>
                                <label className="section-label" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    Idempotency Key
                                    <span className="badge" style={{ background: "rgba(59,130,246,0.08)", color: "var(--color-info)", border: "1px solid rgba(59,130,246,0.25)", padding: "3px 10px", fontSize: "10px", textTransform: "none", letterSpacing: "0" }}>
                                        Auto-generated
                                    </span>
                                </label>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <input
                                        type="text"
                                        value={idempotencyKey}
                                        readOnly
                                        className="input-field"
                                        style={{ flex: 1, fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", padding: "14px 20px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIdempotencyKey(generateKey())}
                                        className="btn-secondary"
                                        style={{ padding: "14px 24px", fontSize: "13px", whiteSpace: "nowrap" }}
                                    >
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "16px", marginTop: "36px" }}>
                            <button
                                type="submit"
                                disabled={loading || !selectedAccount}
                                className="btn-primary"
                                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                                        Processing...
                                    </>
                                ) : "Transfer Funds"}
                            </button>

                            {txnStatus === "COMPLETED" && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn-secondary"
                                >
                                    New Transfer
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Info note */}
                <div
                    style={{
                        marginTop: "24px",
                        padding: "20px 24px",
                        borderRadius: "16px",
                        background: "rgba(59,130,246,0.04)",
                        border: "1px solid rgba(59,130,246,0.12)"
                    }}
                >
                    <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
                        The idempotency key prevents duplicate transfers. If you submit the same key twice, the backend returns the original result instead of creating a new transaction.
                    </p>
                </div>
            </div>
        </div>
    )
}

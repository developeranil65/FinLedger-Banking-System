import { useEffect, useState } from "react"
import api from "../services/api"

export default function DashboardOverview({
    accounts,
    selectedAccount,
    setSelectedAccount,
    balance,
    balanceSource,
    fetchAccounts,
    fetchBalance,
    createAccount,
    loading
}) {
    const [depositAmount, setDepositAmount] = useState("")
    const [depositing, setDepositing] = useState(false)
    const [depositMsg, setDepositMsg] = useState(null)
    const [closing, setClosing] = useState(false)
    const [closeConfirm, setCloseConfirm] = useState(false)
    const [closeMsg, setCloseMsg] = useState(null)

    useEffect(() => { fetchAccounts() }, [])
    useEffect(() => {
        if (selectedAccount?._id) fetchBalance(selectedAccount._id)
    }, [selectedAccount])

    async function handleDeposit() {
        if (!depositAmount || Number(depositAmount) <= 0) return
        setDepositing(true)
        setDepositMsg(null)
        try {
            await api.post("/transactions/deposit", {
                accountId: selectedAccount._id,
                amount: Number(depositAmount),
                idempotencyKey: crypto.randomUUID()
            })
            setDepositMsg({ ok: true, text: "Deposit successful! Balance updated." })
            setDepositAmount("")
            fetchBalance(selectedAccount._id)
        } catch (err) {
            setDepositMsg({ ok: false, text: err.response?.data?.message || "Deposit failed" })
        } finally {
            setDepositing(false)
        }
    }

    const isRedis = balanceSource === "cache"
    const isClosed = selectedAccount?.status === "CLOSED"

    async function handleCloseAccount() {
        if (!closeConfirm) {
            setCloseConfirm(true)
            return
        }
        setClosing(true)
        setCloseMsg(null)
        try {
            const res = await api.delete(`/accounts/${selectedAccount._id}`)
            setCloseMsg({ ok: true, text: res.data.message })
            setCloseConfirm(false)
            // Refresh accounts list and clear selection
            fetchAccounts()
            setSelectedAccount(null)
        } catch (err) {
            setCloseMsg({ ok: false, text: err.response?.data?.message || "Failed to close account" })
            setCloseConfirm(false)
        } finally {
            setClosing(false)
        }
    }

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                        Overview
                    </h2>
                    <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", marginTop: "6px" }}>
                        Manage your accounts and balances
                    </p>
                </div>
                <button
                    onClick={createAccount}
                    disabled={loading}
                    className="btn-primary"
                >
                    New Account
                </button>
            </div>

            {/* Account pills */}
            {accounts.length > 0 && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {accounts.map((acc) => {
                        const isSelected = selectedAccount?._id === acc._id
                        return (
                            <button
                                key={acc._id}
                                onClick={() => { setSelectedAccount(acc); setCloseConfirm(false); setCloseMsg(null) }}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "14px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    border: isSelected
                                        ? "1px solid rgba(79,110,247,0.4)"
                                        : acc.status === "CLOSED"
                                            ? "1px solid rgba(239,68,68,0.2)"
                                            : "1px solid var(--color-border)",
                                    background: isSelected
                                        ? "rgba(79,110,247,0.15)"
                                        : acc.status === "CLOSED"
                                            ? "rgba(239,68,68,0.05)"
                                            : "rgba(255,255,255,0.02)",
                                    color: isSelected
                                        ? "var(--color-primary-light)"
                                        : acc.status === "CLOSED"
                                            ? "var(--color-text-muted)"
                                            : "var(--color-text-secondary)",
                                    boxShadow: isSelected
                                        ? "0 0 0 1px rgba(79,110,247,0.2)"
                                        : "none",
                                    opacity: acc.status === "CLOSED" ? 0.7 : 1
                                }}
                            >
                                <span style={{ fontFamily: "var(--font-mono)" }}>{acc._id.slice(-6).toUpperCase()}</span>
                                <span style={{ marginLeft: "10px", opacity: 0.6 }}>{acc.currency || "INR"}</span>
                                {acc.status === "CLOSED" && (
                                    <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 600, color: "var(--color-danger)", opacity: 0.8 }}>CLOSED</span>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Balance card */}
            {selectedAccount && (
                <div
                    className="card"
                    style={{ overflow: "hidden" }}
                >
                    {/* Top gradient strip */}
                    <div style={{ height: "3px", background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light), var(--color-primary))" }} />

                    <div style={{ padding: "44px 48px" }}>
                        {/* Balance row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
                            <div>
                                <p className="section-label" style={{ marginBottom: "12px" }}>Account Balance</p>
                                <p style={{ fontSize: "52px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                                    <span style={{ fontSize: "28px", fontWeight: 500, marginRight: "4px", color: "var(--color-text-secondary)" }}>₹</span>
                                    {balance !== null ? balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                                </p>
                            </div>

                            {/* Cache badge */}
                            {balanceSource && (
                                <span
                                    className="badge"
                                    style={isRedis ? {
                                        background: "rgba(34,197,94,0.1)",
                                        color: "var(--color-success)",
                                        border: "1px solid rgba(34,197,94,0.25)"
                                    } : {
                                        background: "rgba(234,179,8,0.1)",
                                        color: "var(--color-warning)",
                                        border: "1px solid rgba(234,179,8,0.25)"
                                    }}
                                >
                                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: isRedis ? "var(--color-success)" : "var(--color-warning)", boxShadow: `0 0 8px ${isRedis ? "var(--color-success)" : "var(--color-warning)"}` }} />
                                    {isRedis ? "Redis Cache" : "MongoDB"}
                                </span>
                            )}
                        </div>

                        {/* Account meta */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px", paddingBottom: "36px", borderBottom: "1px solid var(--color-border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Account ID</span>
                                <code style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "10px", fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.04)", color: "var(--color-text-primary)" }}>
                                    {selectedAccount._id}
                                </code>
                            </div>
                            <span className="badge" style={{ background: "rgba(79,110,247,0.08)", color: "var(--color-primary-light)", border: "1px solid rgba(79,110,247,0.2)" }}>
                                {selectedAccount.currency || "INR"}
                            </span>
                            {selectedAccount.status && (
                                <span className="badge" style={{ background: "rgba(34,197,94,0.08)", color: "var(--color-success)", border: "1px solid rgba(34,197,94,0.2)" }}>
                                    {selectedAccount.status}
                                </span>
                            )}
                        </div>
                        {/* Fund section — only for active accounts */}
                        {isClosed ? (
                            <div
                                style={{
                                    padding: "24px 28px",
                                    borderRadius: "14px",
                                    background: "rgba(239,68,68,0.06)",
                                    border: "1px solid rgba(239,68,68,0.15)"
                                }}
                            >
                                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-danger)", marginBottom: "4px" }}>
                                    Account Closed
                                </p>
                                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                                    This account has been closed. Ledger entries and transaction history remain available for audit purposes.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "16px" }}>
                                    Fund This Account
                                </p>
                                <div style={{ display: "flex", gap: "16px" }}>
                                    <div style={{ position: "relative", flex: 1 }}>
                                        <span style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", fontWeight: 500, color: "var(--color-text-secondary)" }}>₹</span>
                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            placeholder="0.00"
                                            min="1"
                                            className="input-field"
                                            style={{ paddingLeft: "44px", fontFamily: "var(--font-mono)" }}
                                            onKeyDown={e => e.key === "Enter" && handleDeposit()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleDeposit}
                                        disabled={depositing || !depositAmount}
                                        className="btn-primary"
                                        style={{
                                            background: depositing || !depositAmount
                                                ? "rgba(34,197,94,0.3)"
                                                : "linear-gradient(135deg, var(--color-success), #16a34a)",
                                            boxShadow: depositing || !depositAmount
                                                ? "none"
                                                : "0 6px 20px rgba(34,197,94,0.25)"
                                        }}
                                    >
                                        {depositing ? (
                                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span className="animate-spin" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                                                Processing...
                                            </span>
                                        ) : "Deposit"}
                                    </button>
                                </div>

                                {depositMsg && (
                                    <div
                                        className="animate-fade-in"
                                        style={{
                                            marginTop: "16px",
                                            padding: "14px 20px",
                                            borderRadius: "14px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            color: depositMsg.ok ? "var(--color-success)" : "var(--color-danger)",
                                            background: depositMsg.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                                            border: depositMsg.ok ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)"
                                        }}
                                    >
                                        {depositMsg.text}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: "20px 48px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(0,0,0,0.15)",
                            borderTop: "1px solid var(--color-border)"
                        }}
                    >
                        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Account ID: {selectedAccount._id}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button
                                onClick={() => fetchBalance(selectedAccount._id)}
                                className="btn-secondary"
                                style={{ padding: "8px 20px", fontSize: "12px" }}
                            >
                                Refresh
                            </button>

                            {!isClosed && (
                                <button
                                    onClick={handleCloseAccount}
                                    disabled={closing}
                                    style={{
                                        padding: "8px 20px",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                        fontWeight: closeConfirm ? 600 : 500,
                                        cursor: closing ? "not-allowed" : "pointer",
                                        transition: "all 0.2s ease",
                                        border: closeConfirm ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(239,68,68,0.25)",
                                        background: closeConfirm ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
                                        color: "var(--color-danger)"
                                    }}
                                >
                                    {closing ? "Closing..." : closeConfirm ? "Confirm Close" : "Close Account"}
                                </button>
                            )}

                            {closeConfirm && !closing && (
                                <button
                                    onClick={() => setCloseConfirm(false)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--color-text-secondary)"
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Close account feedback */}
                    {closeMsg && (
                        <div
                            className="animate-fade-in"
                            style={{
                                margin: "0 48px 24px",
                                padding: "14px 20px",
                                borderRadius: "14px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: closeMsg.ok ? "var(--color-success)" : "var(--color-danger)",
                                background: closeMsg.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                                border: closeMsg.ok ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)"
                            }}
                        >
                            {closeMsg.text}
                        </div>
                    )}
                </div>
            )
            }

            {/* Empty state */}
            {
                accounts.length === 0 && !loading && (
                    <div
                        className="card animate-fade-in"
                        style={{
                            padding: "80px 40px",
                            textAlign: "center",
                            borderStyle: "dashed"
                        }}
                    >
                        <p style={{ fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "12px" }}>
                            No Accounts Yet
                        </p>
                        <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", marginBottom: "36px" }}>
                            Create your first bank account to get started.
                        </p>
                        <button onClick={createAccount} className="btn-primary">
                            Create Account
                        </button>
                    </div>
                )
            }
        </div >
    )
}

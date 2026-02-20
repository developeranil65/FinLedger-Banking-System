import { useState, useEffect, useCallback } from "react"
import api from "../services/api"

export default function TransactionHistory({ selectedAccount }) {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchEntries = useCallback(async () => {
        if (!selectedAccount?._id) return
        setLoading(true)
        try {
            const res = await api.get(`/ledger/${selectedAccount._id}`)
            setEntries(res.data.entries)
        } catch {
            setEntries([])
        } finally {
            setLoading(false)
        }
    }, [selectedAccount])

    useEffect(() => {
        fetchEntries()
    }, [fetchEntries])

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2 style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                        Transaction History
                    </h2>
                    <p style={{ fontSize: "15px", color: "var(--color-text-secondary)", marginTop: "6px" }}>
                        View all ledger entries for the selected account
                    </p>
                </div>
                <button
                    onClick={fetchEntries}
                    disabled={loading}
                    className="btn-secondary"
                    style={{ opacity: loading ? 0.5 : 1 }}
                >
                    Refresh
                </button>
            </div>

            {/* Immutable Ledger Badge */}
            <div
                className="badge"
                style={{
                    background: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.18)",
                    padding: "10px 20px",
                    borderRadius: "14px",
                    width: "fit-content",
                    gap: "12px"
                }}
            >
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-info)" }}>Immutable Ledger</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 400 }}>Entries cannot be modified or deleted</span>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                            {["Date", "Type", "Amount", "Transaction ID", "Status"].map((header, i) => (
                                <th
                                    key={header}
                                    style={{
                                        textAlign: i === 2 ? "right" : "left",
                                        padding: "20px 32px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                        color: "var(--color-text-secondary)"
                                    }}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 && !loading && (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        padding: "72px 32px",
                                        textAlign: "center",
                                        fontSize: "14px",
                                        color: "var(--color-text-secondary)"
                                    }}
                                >
                                    No ledger entries found. Make a transaction to see entries here.
                                </td>
                            </tr>
                        )}

                        {loading && (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        padding: "72px 32px",
                                        textAlign: "center",
                                        fontSize: "14px",
                                        color: "var(--color-text-secondary)"
                                    }}
                                >
                                    <span
                                        className="animate-spin"
                                        style={{
                                            display: "inline-block",
                                            width: "16px",
                                            height: "16px",
                                            border: "2px solid rgba(79,110,247,0.3)",
                                            borderTopColor: "var(--color-primary)",
                                            borderRadius: "50%",
                                            marginRight: "10px",
                                            verticalAlign: "middle"
                                        }}
                                    />
                                    Loading ledger entries...
                                </td>
                            </tr>
                        )}

                        {entries.map((entry) => (
                            <tr
                                key={entry._id}
                                style={{ borderBottom: "1px solid rgba(26,39,68,0.5)", transition: "background 0.15s ease" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <td style={{ padding: "20px 32px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                                    {entry.transaction?.createdAt
                                        ? new Date(entry.transaction.createdAt).toLocaleString("en-IN", {
                                            day: "2-digit", month: "short", year: "numeric",
                                            hour: "2-digit", minute: "2-digit"
                                        })
                                        : "—"
                                    }
                                </td>
                                <td style={{ padding: "20px 32px" }}>
                                    <span
                                        className="badge"
                                        style={entry.type === "CREDIT" ? {
                                            background: "rgba(34,197,94,0.08)",
                                            color: "var(--color-success)",
                                            border: "1px solid rgba(34,197,94,0.25)"
                                        } : {
                                            background: "rgba(239,68,68,0.08)",
                                            color: "var(--color-danger)",
                                            border: "1px solid rgba(239,68,68,0.25)"
                                        }}
                                    >
                                        {entry.type}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        padding: "20px 32px",
                                        textAlign: "right",
                                        fontSize: "14px",
                                        fontFamily: "var(--font-mono)",
                                        fontWeight: 600,
                                        color: entry.type === "CREDIT" ? "var(--color-success)" : "var(--color-danger)"
                                    }}
                                >
                                    {entry.type === "CREDIT" ? "+" : "−"}₹{entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: "20px 32px" }}>
                                    <code
                                        style={{
                                            fontSize: "12px",
                                            padding: "6px 14px",
                                            borderRadius: "10px",
                                            fontFamily: "var(--font-mono)",
                                            color: "var(--color-text-secondary)",
                                            background: "rgba(255,255,255,0.04)"
                                        }}
                                    >
                                        {entry.transaction?._id?.slice(-8) || "—"}
                                    </code>
                                </td>
                                <td style={{ padding: "20px 32px" }}>
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: entry.transaction?.status === "COMPLETED" ? "var(--color-success)" : "var(--color-warning)"
                                        }}
                                    >
                                        {entry.transaction?.status || "—"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

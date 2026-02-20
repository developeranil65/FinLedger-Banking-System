import { useState, useCallback } from "react"
import api from "../services/api"

/**
 * useAccounts Hook
 * ─────────────────
 * Fetches accounts and balances for the logged-in user.
 * Tracks whether the balance came from Redis cache or MongoDB.
 */
export function useAccounts() {
    const [accounts, setAccounts] = useState([])
    const [selectedAccount, setSelectedAccount] = useState(null)
    const [balance, setBalance] = useState(null)
    const [balanceSource, setBalanceSource] = useState(null) // "cache" or "database"
    const [loading, setLoading] = useState(false)

    const fetchAccounts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get("/accounts")
            setAccounts(res.data.accounts)
            if (res.data.accounts.length > 0 && !selectedAccount) {
                setSelectedAccount(res.data.accounts[0])
            }
        } finally {
            setLoading(false)
        }
    }, [selectedAccount])

    const fetchBalance = useCallback(async (accountId) => {
        if (!accountId) return
        try {
            const res = await api.get(`/accounts/balance/${accountId}`)
            setBalance(res.data.balance)
            // Use the actual source field returned by the backend
            setBalanceSource(res.data.source || null)
        } catch {
            setBalance(null)
            setBalanceSource(null)
        }
    }, [])

    const createAccount = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.post("/accounts")
            setAccounts(prev => [...prev, res.data.account])
            setSelectedAccount(res.data.account)
            return res.data.account
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        accounts,
        selectedAccount,
        setSelectedAccount,
        balance,
        balanceSource,
        loading,
        fetchAccounts,
        fetchBalance,
        createAccount
    }
}

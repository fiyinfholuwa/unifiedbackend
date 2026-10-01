import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';

const WalletContext = createContext();
const STATE_KEY = '@wallet_state';
export const UNIT_PRICE_NGN = 10;

const demoTransactions = [
  {
    id: 'demo-plan-purchase',
    type: 'subscription',
    title: 'Pro plan activated',
    amount: 100,
    direction: 'debit',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    demo: true,
  },
  {
    id: 'demo-wallet-funding',
    type: 'funding',
    title: 'Wallet funded',
    amount: 500,
    direction: 'credit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    demo: true,
  },
];

const initialState = {
  kycStatus: 'not_started',
  kycName: '',
  accountNumber: null,
  paymentSession: null,
  balance: 0,
  transactions: demoTransactions,
};

const normaliseWallet = wallet => ({
  ...wallet,
  kycStatus: wallet.kyc_status ?? wallet.kycStatus ?? 'not_started',
  kycName: wallet.kyc_name ?? wallet.kycName ?? '',
  kycBusinessName: wallet.kyc_business_name ?? wallet.kycBusinessName ?? '',
  transactions: (wallet.transactions || []).map(transaction => ({
    ...transaction,
    timestamp: transaction.timestamp || transaction.occurred_at,
    amount: Number(transaction.amount || 0),
  })),
});

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setState(initialState); setLoading(false); return undefined; }
    setLoading(true);
    apiService.getWallet().then(wallet => setState({ ...initialState, ...normaliseWallet(wallet) })).catch(() => {}).finally(() => setLoading(false));
    return undefined;
  }, [user]);

  const persist = async updates => {
    const next = { ...state, ...updates }; setState(next); return next;
  };

  const makeTransaction = (type, title, amount = 0, direction = 'neutral') => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    amount,
    direction,
    timestamp: new Date().toISOString(),
  });

  const completeKyc = async (businessName, nin, document) => { const wallet = await apiService.completeKyc(businessName, nin, document); setState({ ...state, ...normaliseWallet(wallet) }); };

  const createPaymentSession = async (amount, method = 'globus_bank_transfer') => {
    if (state.kycStatus !== 'verified') throw new Error('KYC_REQUIRED');
    const units = Math.floor(Number(amount));
    if (!Number.isFinite(units) || units < 10 || units > 100000) throw new Error('INVALID_UNIT_AMOUNT');
    const session = await apiService.createPaymentSession(units, method); setState({ ...state, accountNumber: session.accountNumber, paymentSession: session });
    return session;
  };

  const confirmPayment = async () => {
    const success = await apiService.confirmPayment(); const wallet = await apiService.getWallet(); setState({ ...state, ...normaliseWallet(wallet) }); return success;
  };

  const cancelPaymentSession = async () => { await apiService.cancelPaymentSession(); setState({ ...state, paymentSession: null, accountNumber: null }); };

  const spendUnits = async (amount, title = 'Plan subscription') => {
    const success = await apiService.spendUnits(amount, title); if (success) { const wallet = await apiService.getWallet(); setState({ ...state, ...normaliseWallet(wallet) }); } return success;
  };

  const logActivity = async title => { await apiService.logActivity(title); const wallet = await apiService.getWallet(); setState({ ...state, ...normaliseWallet(wallet) }); };

  const value = useMemo(() => ({ ...state, loading, completeKyc, createPaymentSession, confirmPayment, cancelPaymentSession, spendUnits, logActivity }), [state, loading]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWallet = () => useContext(WalletContext);

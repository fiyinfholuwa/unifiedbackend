import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';

export const plans = {
  free: { id: 'free', name: 'Basic', billing_type: 'free', billingType: 'free', price: 'Free forever', unitCost: 0, limit: 50, color: '#778196', features: ['50 free successful replies once per account'] },
  pro: { id: 'pro', name: 'Premium', billing_type: 'monthly', billingType: 'monthly', price: '₦5,000 / month', unitCost: 500, limit: 1000, color: '#4968E8', features: ['1,000 successful replies per billing month'] },
  payg: { id: 'payg', name: 'Pay-As-You-Go', billing_type: 'payg', billingType: 'payg', price: '₦10 / reply', unitCost: 0, limit: Infinity, color: '#8B5CF6', features: ['Prepaid reply credits'] },
};

const mapPlans = items => items.reduce((result, item) => ({
  ...result,
  [item.id]: {
    ...item,
    unitCost: item.price_units,
    price: item.display_price || `${item.price_units} units`,
    displayPrice: item.display_price || `${item.price_units} units`,
    billingType: item.billing_type || 'monthly',
    limit: item.reply_allowance ?? item.message_limit ?? Infinity,
    channelLimit: item.channel_limit,
    userLimit: item.user_limit,
    description: item.description || '',
    bestFor: item.best_for || '',
    features: item.features || [],
  },
}), {});

const SubscriptionContext = createContext();
const PLAN_KEY = '@subscription_plan';
const USAGE_KEY = '@message_usage';

const currentPeriod = () => new Date().toISOString().slice(0, 7);

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [planId, setPlanId] = useState('free');
  const [availablePlans, setAvailablePlans] = useState(plans);
  const [creditBundles, setCreditBundles] = useState([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [usage, setUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPlanId('free'); setAvailablePlans(plans); setCreditBundles([]); setHasSubscription(false); setUsage(0); setLoading(false); return undefined; }
    setLoading(true);
    const load = async () => {
      const [subscription, pricing] = await Promise.all([apiService.getSubscription(), apiService.getPricing()]);
      const configuredPlans = mapPlans(pricing.plans || []);
      setAvailablePlans(Object.keys(configuredPlans).length ? configuredPlans : plans);
      setCreditBundles(pricing.credit_bundles || []);
      setPlanId(subscription.plan_id); setHasSubscription(subscription.plan_id !== 'free'); setUsage(subscription.usage || 0);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [user]);

  const selectPlan = async id => {
    if (!availablePlans[id]) return;
    await apiService.selectPlan(id); setPlanId(id); setHasSubscription(id !== 'free');
  };

  const plan = availablePlans[planId] || availablePlans.free || plans.free;
  const canSendMessage = plan.limit === Infinity || usage < plan.limit;
  const remaining = plan.limit === Infinity ? Infinity : Math.max(plan.limit - usage, 0);

  const value = useMemo(() => ({
    plan,
    plans: availablePlans,
    creditBundles,
    planId,
    usage,
    remaining,
    canSendMessage,
    hasSubscription,
    loading,
    selectPlan,
  }), [plan, availablePlans, planId, usage, remaining, canSendMessage, hasSubscription, loading]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscription = () => useContext(SubscriptionContext);

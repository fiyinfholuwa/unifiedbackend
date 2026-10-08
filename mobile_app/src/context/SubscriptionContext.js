import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';

export const plans = {
  free: { id: 'free', name: 'Free', price: '0 units', unitCost: 0, limit: 50, color: '#778196' },
  pro: { id: 'pro', name: 'Pro', price: '100 units', unitCost: 100, limit: 1000, color: '#4968E8' },
  business: { id: 'business', name: 'Business', price: '250 units', unitCost: 250, limit: Infinity, color: '#8B5CF6' },
};

const mapPlans = items => items.reduce((result, item) => ({
  ...result,
  [item.id]: {
    ...item,
    unitCost: item.price_units,
    price: `${item.price_units} units`,
    limit: item.message_limit ?? Infinity,
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
  const [hasSubscription, setHasSubscription] = useState(false);
  const [usage, setUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPlanId('free'); setAvailablePlans(plans); setHasSubscription(false); setUsage(0); setLoading(false); return undefined; }
    setLoading(true);
    const load = async () => {
      const [subscription, remotePlans] = await Promise.all([apiService.getSubscription(), apiService.getPlans()]);
      const configuredPlans = mapPlans(remotePlans);
      setAvailablePlans(Object.keys(configuredPlans).length ? configuredPlans : plans);
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

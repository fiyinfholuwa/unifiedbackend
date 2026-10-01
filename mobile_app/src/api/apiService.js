import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Set EXPO_PUBLIC_API_URL for a physical device, e.g. http://192.168.1.10:8000/api/v1.
const localHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || `http://${localHost}:8000/api/v1`;

async function request(path, options = {}) {
  const token = await AsyncStorage.getItem('@auth_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { Accept: 'application/json', ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Request failed');
  return body;
}

const post = (path, body = {}) => request(path, { method: 'POST', body: JSON.stringify(body) });

const apiService = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (name, email, password) => post('/auth/register', { name, email, password }),
  forgotPassword: email => post('/auth/forgot-password', { email }),
  resetPassword: (email, code, password) => post('/auth/reset-password', { email, code, password }),
  getUserProfile: async () => (await request('/auth/me')).user,
  updateUserProfile: async updates => {
    if (!updates.avatar) return (await request('/auth/profile', { method: 'PATCH', body: JSON.stringify(updates) })).user;
    const body = new FormData();
    if (updates.name !== undefined) body.append('name', updates.name);
    if (updates.email !== undefined) body.append('email', updates.email);
    if (updates.bio !== undefined) body.append('bio', updates.bio);
    body.append('avatar', { uri: updates.avatar.uri, name: updates.avatar.name || 'profile.jpg', type: updates.avatar.mimeType || 'image/jpeg' });
    return (await request('/auth/profile', { method: 'PATCH', body })).user;
  },
  deleteUserProfile: () => request('/auth/profile', { method: 'DELETE' }),
  getPlatforms: async () => (await request('/platforms')).platforms,
  startPlatformConnection: async platform => (await request(`/social/${platform}/start`)).authorization_url,
  savePlatformCredentials: (platform, credentials) => post(`/social/${platform}/credentials`, credentials),
  connectPlatform: platform => post(`/platforms/${platform}/connect`),
  disconnectPlatform: platform => request(`/platforms/${platform}`, { method: 'DELETE' }),
  getConversations: async () => (await request('/conversations')).conversations,
  getMessages: async id => (await request(`/conversations/${id}/messages`)).messages,
  sendMessage: async (id, text) => (await post(`/conversations/${id}/messages`, { text })).message,
  sendMediaMessage: async (id, payload) => (await post(`/conversations/${id}/messages`, payload)).message,
  reactToMessage: async (id, messageId, reaction) => (await post(`/conversations/${id}/messages/${messageId}/reaction`, { reaction })).message,
  deleteMessage: (id, messageId, forEveryone = false) => request(`/conversations/${id}/messages/${messageId}?forEveryone=${forEveryone ? '1' : '0'}`, { method: 'DELETE' }),
  getWallet: async () => (await request('/wallet')).wallet,
  completeKyc: async (businessName, nin, document) => {
    const body = new FormData();
    body.append('businessName', businessName);
    body.append('nin', nin);
    body.append('ninDocument', { uri: document.uri, name: document.name || 'nin-document.jpg', type: document.mimeType || document.type || 'image/jpeg' });
    return (await request('/wallet/kyc', { method: 'POST', body })).wallet;
  },
  createPaymentSession: async (amount, method) => (await post('/wallet/payment-session', { amount, method })).session,
  confirmPayment: async () => (await post('/wallet/payment-session/confirm')).success,
  cancelPaymentSession: () => request('/wallet/payment-session', { method: 'DELETE' }),
  spendUnits: async (amount, title) => (await post('/wallet/spend', { amount, title })).success,
  logActivity: title => post('/wallet/activity', { title }),
  getSubscription: async () => (await request('/subscription')).subscription,
  getPlans: async () => (await request('/plans')).plans,
  selectPlan: planId => request('/subscription', { method: 'PUT', body: JSON.stringify({ planId }) }),
  recordSentMessage: async () => (await post('/subscription/usage')).usage,
  submitSupport: (mode, subject, message) => post('/support-requests', { mode, subject, message }),
};

export default apiService;

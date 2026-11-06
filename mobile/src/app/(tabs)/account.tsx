import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ContactLauncher } from '@/components/ContactLauncher';
import { MobileHeader } from '@/components/Header';
import { C, R, shadow } from '@/constants/theme';
import { API, taka, WHATSAPP } from '@/lib/api';

type Address = {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  district: string;
  upazila?: string;
  is_default: boolean;
};

type OrderHistoryItem = {
  id: number;
  status: string;
  status_display?: string;
  total: string | number;
  created_at: string;
  items?: {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string | number;
  }[];
};

type AccountData = {
  authenticated: boolean;
  name?: string;
  email?: string;
  profile?: { phone?: string; avatar_url?: string };
  addresses?: Address[];
  orders?: OrderHistoryItem[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  processing: 'প্রস্তুত হচ্ছে',
  paid: 'পেমেন্ট সম্পন্ন',
  shipped: 'শিপ করা হয়েছে',
  delivered: 'ডেলিভারি সম্পন্ন',
  cancelled: 'বাতিল',
};

export default function AccountScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');

  // Auth form states
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const loadAccount = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('user-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/auth/me/`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setAccount(data);
      } else {
        setAccount({ authenticated: false });
      }
    } catch {
      setAccount({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setAuthError('অনুগ্রহ করে সব তথ্য দিন।');
      return;
    }
    setSubmitting(true);
    setAuthError('');
    try {
      const res = await fetch(`${API}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: emailOrPhone.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await AsyncStorage.setItem('user-token', data.token);
        await loadAccount();
      } else {
        setAuthError(data.detail || data.error || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
      }
    } catch {
      setAuthError('সার্ভারে যোগাযোগ করা যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !emailOrPhone.trim() || !password.trim()) {
      setAuthError('অনুগ্রহ করে নাম, ফোন/ইমেইল ও পাসওয়ার্ড দিন।');
      return;
    }
    setSubmitting(true);
    setAuthError('');
    try {
      const res = await fetch(`${API}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: emailOrPhone.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('সফল', 'নিবন্ধন সম্পন্ন হয়েছে! এখন লগইন করুন।');
        setIsLoginMode(true);
      } else {
        setAuthError(data.detail || data.error || 'নিবন্ধন ব্যর্থ হয়েছে।');
      }
    } catch {
      setAuthError('সার্ভারে যোগাযোগ করা যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user-token');
    setAccount({ authenticated: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <MobileHeader />

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={C.forest} />
            <Text style={{ marginTop: 12, color: C.muted }}>লোড হচ্ছে...</Text>
          </View>
        ) : account?.authenticated ? (
          /* Profile & Dashboard View */
          <View>
            {/* User Profile Card */}
            <View style={s.profileCard}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarLetter}>{(account.name || 'A').slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.profileName}>{account.name || 'সম্মানিত গ্রাহক'}</Text>
                {account.email ? <Text style={s.profileSub}>{account.email}</Text> : null}
                {account.profile?.phone ? (
                  <Text style={s.profileSub}>{account.profile.phone}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={18} color="#b3261e" />
                <Text style={s.logoutText}>লগআউট</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Tabs */}
            <View style={s.tabBar}>
              <TouchableOpacity
                style={[s.tabItem, activeTab === 'orders' && s.tabItemActive]}
                onPress={() => setActiveTab('orders')}>
                <Text style={[s.tabItemText, activeTab === 'orders' && s.tabItemTextActive]}>
                  📦 অর্ডার হিস্ট্রি ({account.orders?.length || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tabItem, activeTab === 'addresses' && s.tabItemActive]}
                onPress={() => setActiveTab('addresses')}>
                <Text style={[s.tabItemText, activeTab === 'addresses' && s.tabItemTextActive]}>
                  📍 সংরক্ষিত ঠিকানা ({account.addresses?.length || 0})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Orders List */}
            {activeTab === 'orders' && (
              <View style={s.section}>
                {account.orders && account.orders.length > 0 ? (
                  account.orders.map((order) => (
                    <View key={order.id} style={s.orderCard}>
                      <View style={s.orderHeader}>
                        <View>
                          <Text style={s.orderId}>অর্ডার #{order.id}</Text>
                          <Text style={s.orderDate}>
                            {new Date(order.created_at).toLocaleDateString('bn-BD')}
                          </Text>
                        </View>
                        <View style={s.statusBadge}>
                          <Text style={s.statusText}>
                            {STATUS_LABELS[order.status] || order.status}
                          </Text>
                        </View>
                      </View>

                      {order.items && order.items.length > 0 && (
                        <View style={s.orderItemsList}>
                          {order.items.map((item) => (
                            <View key={item.id} style={s.orderItemRow}>
                              <Text style={s.orderItemName} numberOfLines={1}>
                                {item.product_name} × {item.quantity}
                              </Text>
                              <Text style={s.orderItemPrice}>
                                {taka(Number(item.unit_price) * item.quantity)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={s.orderFooter}>
                        <Text style={s.orderTotalLabel}>মোট প্রদেয়:</Text>
                        <Text style={s.orderTotalVal}>{taka(Number(order.total))}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={s.emptyCard}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🛍️</Text>
                    <Text style={s.emptyTitle}>এখনও কোনো অর্ডার করেননি</Text>
                    <TouchableOpacity
                      style={s.shopNowBtn}
                      onPress={() => router.push('/shop')}
                      activeOpacity={0.85}>
                      <Text style={s.shopNowBtnText}>শপে যান</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Addresses List */}
            {activeTab === 'addresses' && (
              <View style={s.section}>
                {account.addresses && account.addresses.length > 0 ? (
                  account.addresses.map((addr) => (
                    <View key={addr.id} style={s.addressCard}>
                      <View style={s.addrHeader}>
                        <Text style={s.addrLabel}>{addr.label || 'ঠিকানা'}</Text>
                        {addr.is_default && (
                          <View style={s.defaultBadge}>
                            <Text style={s.defaultBadgeText}>ডিফল্ট</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.addrRecipient}>{addr.recipient_name}</Text>
                      <Text style={s.addrPhone}>📞 {addr.phone}</Text>
                      <Text style={s.addrText}>
                        {addr.address}, {addr.upazila ? `${addr.upazila}, ` : ''}
                        {addr.district}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={s.emptyCard}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>📍</Text>
                    <Text style={s.emptyTitle}>কোনো ঠিকানা সংরক্ষিত নেই</Text>
                    <Text style={s.emptySub}>চেকআউটের সময় আপনার ঠিকানা স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          /* Sign In / Sign Up Form */
          <View style={s.authBox}>
            <View style={s.authHeader}>
              <Text style={s.authTitle}>{isLoginMode ? 'লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}</Text>
              <Text style={s.authSub}>
                {isLoginMode
                  ? 'আপনার অর্ডার ট্র্যাক করতে ও দ্রুত চেকআউট করতে লগইন করুন।'
                  : 'আলোর ছোঁয়া মার্টের সাথে যুক্ত হতে আপনার তথ্য দিন।'}
              </Text>
            </View>

            {/* Toggle Login / Register */}
            <View style={s.authToggleRow}>
              <TouchableOpacity
                style={[s.authToggleBtn, isLoginMode && s.authToggleBtnActive]}
                onPress={() => {
                  setIsLoginMode(true);
                  setAuthError('');
                }}>
                <Text style={[s.authToggleText, isLoginMode && s.authToggleTextActive]}>লগইন</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.authToggleBtn, !isLoginMode && s.authToggleBtnActive]}
                onPress={() => {
                  setIsLoginMode(false);
                  setAuthError('');
                }}>
                <Text style={[s.authToggleText, !isLoginMode && s.authToggleTextActive]}>নিবন্ধন</Text>
              </TouchableOpacity>
            </View>

            {authError ? <Text style={s.errorBanner}>{authError}</Text> : null}

            {/* Form Fields */}
            {!isLoginMode && (
              <View style={s.fieldWrap}>
                <Text style={s.label}>আপনার নাম</Text>
                <TextInput
                  style={s.input}
                  placeholder="যেমন: আব্দুল্লাহ"
                  placeholderTextColor={C.muted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={s.fieldWrap}>
              <Text style={s.label}>মোবাইল নম্বর বা ইমেইল</Text>
              <TextInput
                style={s.input}
                placeholder="01XXXXXXXXX বা email@example.com"
                placeholderTextColor={C.muted}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>পাসওয়ার্ড</Text>
              <TextInput
                style={s.input}
                placeholder="পাসওয়ার্ড লিখুন"
                placeholderTextColor={C.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={s.submitBtn}
              onPress={isLoginMode ? handleLogin : handleRegister}
              disabled={submitting}
              activeOpacity={0.85}>
              <Text style={s.submitBtnText}>
                {submitting ? 'প্রসেস হচ্ছে...' : isLoginMode ? 'লগইন করুন →' : 'নিবন্ধন করুন →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 16, alignItems: 'center' }}
              onPress={() => Linking.openURL(WHATSAPP)}>
              <Text style={{ fontSize: 13, color: C.emerald, fontWeight: '700' }}>
                পাসওয়ার্ড ভুলে গেছেন? হোয়াটসঅ্যাপে সহায়তা নিন ➔
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 90,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
    gap: 12,
    ...shadow,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.forest,
    borderWidth: 2,
    borderColor: C.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '900',
    color: C.gold,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: C.forest,
  },
  profileSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b3261e',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ece6d8',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: C.forest,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.forest,
  },
  tabItemTextActive: {
    color: C.ivory,
  },
  section: {
    gap: 10,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '900',
    color: C.forest,
  },
  orderDate: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e7f0ec',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.forest,
  },
  orderItemsList: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 6,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 12,
    color: C.ink,
    flex: 1,
    marginRight: 10,
  },
  orderItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: C.forest,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
  },
  orderTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: C.forest,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
    gap: 4,
  },
  addrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addrLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.forest,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: C.gold,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.forest,
  },
  addrRecipient: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  addrPhone: {
    fontSize: 12,
    color: C.muted,
  },
  addrText: {
    fontSize: 12,
    color: C.ink,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.forest,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
  },
  shopNowBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: C.forest,
  },
  shopNowBtnText: {
    color: C.ivory,
    fontWeight: '800',
    fontSize: 13,
  },
  authBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
  authHeader: {
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: C.forest,
  },
  authSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
    lineHeight: 17,
  },
  authToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#ece6d8',
    borderRadius: R.pill,
    padding: 3,
    marginBottom: 16,
  },
  authToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: R.pill,
    alignItems: 'center',
  },
  authToggleBtnActive: {
    backgroundColor: C.forest,
  },
  authToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.forest,
  },
  authToggleTextActive: {
    color: C.ivory,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: '#b3261e',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: C.forest,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fbf9f4',
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 12,
    fontSize: 14,
    color: C.ink,
  },
  submitBtn: {
    height: 46,
    borderRadius: R.pill,
    backgroundColor: C.forest,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: C.ivory,
    fontSize: 14,
    fontWeight: '900',
  },
});


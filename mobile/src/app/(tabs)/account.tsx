import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactLauncher } from '@/components/ContactLauncher';
import { MobileHeader } from '@/components/Header';
import { C, R, shadow } from '@/constants/theme';
import { BANGLADESH_DISTRICTS } from '@/data/bangladesh-locations';
import { API, img, taka } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

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
  payment_method?: string;
  address?: string;
  delivery_charge?: string | number;
  discount_amount?: string | number;
  created_at: string;
  total: string | number;
  items?: {
    id: number;
    product_name: string;
    product_slug: string;
    product_image?: string;
    quantity: number;
    unit_price: string | number;
  }[];
};

type AccountData = {
  authenticated: boolean;
  name?: string;
  email?: string;
  avatar_url?: string;
  profile?: { phone?: string; avatar_url?: string };
  addresses?: Address[];
  orders?: OrderHistoryItem[];
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef3c7', color: '#d97706', label: 'পেন্ডিং (প্রসেসিং চলছে)' },
  confirmed: { bg: '#e0f2fe', color: '#0284c7', label: 'কনফার্ম করা হয়েছে' },
  processing: { bg: '#e0e7ff', color: '#4f46e5', label: 'প্রসেসিং' },
  shipped: { bg: '#fae8ff', color: '#c026d3', label: 'শিপিং এ আছে' },
  delivered: { bg: '#d1fae5', color: '#059669', label: 'ডেলিভারি সম্পন্ন' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'বাতিলকৃত' },
};

const ORDER_TIMELINE_STEPS = [
  { key: 'pending', label: 'অপেক্ষমাণ' },
  { key: 'confirmed', label: 'নিশ্চিত' },
  { key: 'processing', label: 'প্রস্তুত' },
  { key: 'shipped', label: 'শিপিং' },
  { key: 'delivered', label: 'ডেলিভারি' },
];

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'addresses' | 'settings'>('history');

  // Notice & submitting states
  const [notice, setNotice] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Profile fields
  const [profileName, setProfileName] = useState('');
  const [phone, setPhone] = useState('');

  // Address form fields
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '',
    recipient_name: '',
    phone: '',
    address: '',
    district: '',
    upazila: '',
    is_default: true,
  });

  // Location selector modal states
  const [selectorModalVisible, setSelectorModalVisible] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'district' | 'upazila'>('district');
  const [locationSearch, setLocationSearch] = useState('');

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
        if (data.authenticated) {
          setProfileName(data.name || '');
          setPhone(data.profile?.phone || '');
        }
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

    // Deep link listener for OAuth redirect callback
    const sub = Linking.addEventListener('url', async (event) => {
      if (event.url && event.url.includes('session_key=')) {
        const match = event.url.match(/session_key=([^&]+)/);
        if (match && match[1]) {
          await AsyncStorage.setItem('user-token', decodeURIComponent(match[1]));
          setNotice('Google দিয়ে সফলভাবে লগইন হয়েছে!');
          await loadAccount();
        }
      }
    });

    return () => sub.remove();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      setNotice('');
      const redirectUrl = Linking.createURL('account');
      const authUrl = `${API}/auth/google/start/?next=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const match = result.url.match(/session_key=([^&]+)/);
        if (match && match[1]) {
          await AsyncStorage.setItem('user-token', decodeURIComponent(match[1]));
          setNotice('Google দিয়ে সফলভাবে লগইন হয়েছে!');
          await loadAccount();
          return;
        }
      }
      await loadAccount();
    } catch (err) {
      Alert.alert('ত্রুটি', 'Google লগইন সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('লগআউট', 'আপনি কি নিশ্চিত যে অ্যাকাউন্ট থেকে বের হতে চান?', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'লগআউট',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('user-token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            await fetch(`${API}/auth/logout/`, {
              method: 'POST',
              headers,
            }).catch(() => {});
          } finally {
            await AsyncStorage.removeItem('user-token');
            setAccount({ authenticated: false });
            setNotice('');
          }
        },
      },
    ]);
  };

  const saveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('সতর্কতা', 'অনুগ্রহ করে আপনার নাম দিন।');
      return;
    }
    setSavingProfile(true);
    setNotice('');
    try {
      const token = await AsyncStorage.getItem('user-token');
      const res = await fetch(`${API}/customer/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: profileName.trim(), phone: phone.trim() }),
      });
      if (res.ok) {
        setNotice('প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।');
        await loadAccount();
      } else {
        setNotice('প্রোফাইল তথ্য সংরক্ষণ করা সম্ভব হয়নি।');
      }
    } catch {
      setNotice('সার্ভারে যোগাযোগ করা যায়নি।');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAddress = async () => {
    if (!addressForm.recipient_name.trim() || !addressForm.phone.trim() || !addressForm.address.trim()) {
      Alert.alert('সতর্কতা', 'প্রাপকের নাম, মোবাইল নম্বর এবং বিস্তারিত ঠিকানা দেওয়া আবশ্যক।');
      return;
    }
    setSavingAddress(true);
    setNotice('');
    try {
      const isEditing = editingAddressId !== null;
      const url = isEditing
        ? `${API}/customer/addresses/${editingAddressId}/`
        : `${API}/customer/addresses/`;
      const method = isEditing ? 'PATCH' : 'POST';

      const token = await AsyncStorage.getItem('user-token');
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(addressForm),
      });

      if (res.ok) {
        setNotice(isEditing ? 'ঠিকানা আপডেট করা হয়েছে।' : 'নতুন ঠিকানা যোগ করা হয়েছে।');
        setEditingAddressId(null);
        setAddressForm({
          label: '',
          recipient_name: '',
          phone: '',
          address: '',
          district: '',
          upazila: '',
          is_default: true,
        });
        await loadAccount();
      } else {
        setNotice('ঠিকানা সংরক্ষণ করা সম্ভব হয়নি।');
      }
    } catch {
      setNotice('সার্ভারে যোগাযোগ করা যায়নি।');
    } finally {
      setSavingAddress(false);
    }
  };

  const setDefaultAddress = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('user-token');
      const res = await fetch(`${API}/customer/addresses/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_default: true }),
      });
      if (res.ok) {
        setNotice('ডিফল্ট ঠিকানা পরিবর্তন করা হয়েছে।');
        await loadAccount();
      }
    } catch {}
  };

  const deleteAddress = async (id: number) => {
    Alert.alert('নিশ্চিতকরণ', 'আপনি কি নিশ্চিত যে এই ঠিকানাটি মুছে ফেলতে চান?', [
      { text: 'না', style: 'cancel' },
      {
        text: 'মুছে ফেলুন',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('user-token');
            const res = await fetch(`${API}/customer/addresses/${id}/`, {
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
              setNotice('ঠিকানাটি মুছে ফেলা হয়েছে।');
              await loadAccount();
            }
          } catch {}
        },
      },
    ]);
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || '',
      recipient_name: addr.recipient_name || '',
      phone: addr.phone || '',
      address: addr.address || '',
      district: addr.district || '',
      upazila: addr.upazila || '',
      is_default: addr.is_default,
    });
    setActiveTab('addresses');
  };

  // Helper for available upazilas
  const selectedDistrictData = BANGLADESH_DISTRICTS.find(
    (d) => d.district === addressForm.district
  );
  const upazilaOptions = selectedDistrictData ? selectedDistrictData.upazilas : [];

  const filteredDistricts = BANGLADESH_DISTRICTS.filter((d) =>
    d.district.toLowerCase().includes(locationSearch.toLowerCase())
  );
  const filteredUpazilas = upazilaOptions.filter((u) =>
    u.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 14) + 64;

  if (loading) {
    return (
      <View style={s.fill}>
        <MobileHeader />
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={s.loadingText}>লোড হচ্ছে...</Text>
        </View>
      </View>
    );
  }

  // ==========================================
  // UNAUTHENTICATED STATE (Matching Web App)
  // ==========================================
  if (!account?.authenticated) {
    return (
      <View style={s.fill}>
        <MobileHeader />
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.unauthScrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.unauthCard}>
            <View style={s.portalBadge}>
              <Text style={s.portalBadgeText}>কাস্টমার পোর্টাল</Text>
            </View>

            <Text style={s.unauthTitle}>অ্যাকাউন্টে প্রবেশ করুন</Text>

            <Text style={s.unauthSubtitle}>
              Google দিয়ে এক ক্লিকে লগইন করে আপনার সংরক্ষিত ঠিকানা, কেনাকাটার ইতিহাস এবং দ্রুত চেকআউটের সুবিধা উপভোগ করুন।
            </Text>

            <TouchableOpacity
              style={s.googleBtn}
              activeOpacity={0.85}
              onPress={handleGoogleLogin}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <>
                  <Image
                    source={{
                      uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png',
                    }}
                    style={s.googleIcon}
                    contentFit="contain"
                  />
                  <Text style={s.googleBtnText}>Google দিয়ে লগইন করুন</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={s.featureBox}>
              <View style={s.featureRow}>
                <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                <Text style={s.featureText}>১০০% নিরাপদ ও সুরক্ষিত লগইন</Text>
              </View>
              <View style={s.featureRow}>
                <Ionicons name="time" size={18} color="#10b981" />
                <Text style={s.featureText}>এক ক্লিকে সকল অর্ডারের লাইভ ট্র্যাকিং</Text>
              </View>
              <View style={s.featureRow}>
                <Ionicons name="location" size={18} color="#10b981" />
                <Text style={s.featureText}>ঠিকানা সংরক্ষণ ও দ্রুত চেকআউট সুবিধা</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <ContactLauncher />
      </View>
    );
  }

  // ==========================================
  // AUTHENTICATED STATE (Matching Web App)
  // ==========================================
  const avatar = account.avatar_url || account.profile?.avatar_url;
  const initial = (account.name || 'U').charAt(0).toUpperCase();

  return (
    <View style={s.fill}>
      <MobileHeader />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.authScrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Banner */}
        <View style={s.profileBanner}>
          <View style={s.profileInfo}>
            <View style={s.avatarCircle}>
              {avatar ? (
                <Image source={{ uri: img(avatar) || avatar }} style={s.avatarImg} contentFit="cover" />
              ) : (
                <Text style={s.avatarInitial}>{initial}</Text>
              )}
            </View>
            <View style={s.profileTextCol}>
              <Text style={s.welcomeText} numberOfLines={1}>
                স্বাগতম, {account.name || 'গ্রাহক'}
              </Text>
              <Text style={s.emailText} numberOfLines={1}>
                {account.email || 'ইমেইল সংযুক্ত নেই'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={16} color="#dc2626" />
            <Text style={s.logoutBtnText}>লগআউট</Text>
          </TouchableOpacity>
        </View>

        {/* Notice Alert Banner */}
        {!!notice && (
          <View style={s.noticeBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={s.noticeText}>{notice}</Text>
          </View>
        )}

        {/* Navigation Tabs Bar (Matching Web App) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabBar}
        >
          <TouchableOpacity
            style={[s.tabItem, activeTab === 'history' && s.tabItemActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === 'history' && s.tabTextActive]}>
              📦 অর্ডার ইতিহাস (Buy History) ({account.orders?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.tabItem, activeTab === 'addresses' && s.tabItemActive]}
            onPress={() => setActiveTab('addresses')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === 'addresses' && s.tabTextActive]}>
              📍 সংরক্ষিত ঠিকানাসমূহ ({account.addresses?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.tabItem, activeTab === 'settings' && s.tabItemActive]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === 'settings' && s.tabTextActive]}>
              ⚙️ প্রোফাইল সেটিংস
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ======================================= */}
        {/* TAB 1: ORDER HISTORY (BUY HISTORY)     */}
        {/* ======================================= */}
        {activeTab === 'history' && (
          <View style={s.tabContentCard}>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardHeaderTitle}>📦 আপনার অর্ডার ইতিহাস (Buy History)</Text>
            </View>

            {account.orders && account.orders.length > 0 ? (
              <View style={s.orderList}>
                {account.orders.map((order) => {
                  const statusInfo =
                    STATUS_CONFIG[order.status] || {
                      bg: '#f1f5f9',
                      color: '#475569',
                      label: order.status_display || order.status,
                    };
                  const dateStr = new Date(order.created_at).toLocaleDateString('bn-BD', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const stepIndex = ORDER_TIMELINE_STEPS.findIndex((s) => s.key === order.status);

                  return (
                    <View key={order.id} style={s.orderCard}>
                      {/* Order Card Top Bar */}
                      <View style={s.orderCardTop}>
                        <View style={s.orderIdRow}>
                          <Text style={s.orderIdText}>অর্ডার আইডি #{order.id}</Text>
                          <View style={[s.statusBadge, { backgroundColor: statusInfo.bg }]}>
                            <Text style={[s.statusBadgeText, { color: statusInfo.color }]}>
                              {statusInfo.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={s.orderDateText}>অর্ডারের তারিখ: {dateStr}</Text>
                        <View style={s.orderTotalRow}>
                          <Text style={s.orderTotalLabel}>মোট পরিমাণ:</Text>
                          <Text style={s.orderTotalValue}>
                            ৳{Number(order.total).toLocaleString('bn-BD')}
                          </Text>
                        </View>
                      </View>

                      {/* Timeline Visualizer */}
                      {order.status !== 'cancelled' && (
                        <View style={s.timelineContainer}>
                          <View style={s.timelineTrack}>
                            {ORDER_TIMELINE_STEPS.map((step, idx) => {
                              const isCompleted = stepIndex >= idx;
                              const isCurrent = stepIndex === idx;
                              return (
                                <View key={step.key} style={s.timelineStep}>
                                  <View
                                    style={[
                                      s.timelineDot,
                                      isCompleted && s.timelineDotActive,
                                      isCurrent && s.timelineDotCurrent,
                                    ]}
                                  >
                                    <Ionicons
                                      name={isCompleted ? 'checkmark' : 'ellipse'}
                                      size={10}
                                      color={isCompleted ? '#fff' : '#cbd5e1'}
                                    />
                                  </View>
                                  <Text
                                    style={[
                                      s.timelineStepLabel,
                                      isCompleted && s.timelineStepLabelActive,
                                    ]}
                                  >
                                    {step.label}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* Items List */}
                      {order.items && order.items.length > 0 ? (
                        <View style={s.orderItemsList}>
                          {order.items.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={s.orderItemRow}
                              activeOpacity={0.8}
                              onPress={() => router.push(`/product/${item.product_slug}` as any)}
                            >
                              <View style={s.orderItemThumbWrap}>
                                {item.product_image ? (
                                  <Image
                                    source={{ uri: img(item.product_image) }}
                                    style={s.orderItemThumb}
                                    contentFit="cover"
                                  />
                                ) : (
                                  <Text style={{ fontSize: 20 }}>📦</Text>
                                )}
                              </View>
                              <View style={s.orderItemDetails}>
                                <Text style={s.orderItemName} numberOfLines={2}>
                                  {item.product_name}
                                </Text>
                                <Text style={s.orderItemQty}>
                                  পরিমাণ: {item.quantity}টি × ৳{Number(item.unit_price).toLocaleString('bn-BD')}
                                </Text>
                              </View>
                              <Text style={s.orderItemTotal}>
                                ৳{(Number(item.unit_price) * item.quantity).toLocaleString('bn-BD')}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <Text style={s.emptyItemsText}>পণ্য সংক্রান্ত তথ্য প্রসেস হচ্ছে...</Text>
                      )}

                      {/* Order Footer Info */}
                      <View style={s.orderCardFooter}>
                        <View style={s.orderAddressRow}>
                          <Ionicons name="location-outline" size={14} color="#64748b" />
                          <Text style={s.orderAddressText} numberOfLines={2}>
                            <Text style={{ fontWeight: '700' }}>ডেলিভারি ঠিকানা: </Text>
                            {order.address || 'প্রদত্ত ঠিকানা'}
                          </Text>
                        </View>
                        <View style={s.paymentMethodPill}>
                          <Text style={s.paymentMethodText}>
                            {order.payment_method === 'cod'
                              ? '💵 ক্যাশ অন ডেলিভারি'
                              : '💳 অনলাইন পেমেন্ট'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={s.emptyOrdersBox}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>🛍️</Text>
                <Text style={s.emptyOrdersTitle}>এখনও কোনো অর্ডার করেননি!</Text>
                <Text style={s.emptyOrdersSubtitle}>
                  পছন্দের পণ্যগুলো বেছে নিয়ে এখনই প্রথম অর্ডার করুন।
                </Text>
                <TouchableOpacity
                  style={s.startShopBtn}
                  onPress={() => router.push('/' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={s.startShopBtnText}>কেনাকাটা শুরু করুন →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ======================================= */}
        {/* TAB 2: SAVED ADDRESSES                 */}
        {/* ======================================= */}
        {activeTab === 'addresses' && (
          <View style={{ gap: 20 }}>
            {/* List of existing saved addresses */}
            <View style={s.tabContentCard}>
              <Text style={s.cardHeaderTitle}>
                সংরক্ষিত ঠিকানাসমূহ ({account.addresses?.length || 0})
              </Text>

              {account.addresses && account.addresses.length > 0 ? (
                <View style={s.addressGrid}>
                  {account.addresses.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        s.addressCard,
                        item.is_default ? s.addressCardDefault : s.addressCardNormal,
                      ]}
                    >
                      <View style={s.addressCardTop}>
                        <Text style={s.addressLabelText}>📍 {item.label || 'ঠিকানা'}</Text>
                        {item.is_default && (
                          <View style={s.defaultPill}>
                            <Text style={s.defaultPillText}>ডিফল্ট</Text>
                          </View>
                        )}
                      </View>

                      <Text style={s.addressBodyText}>
                        <Text style={{ fontWeight: '700', color: '#0f172a' }}>
                          {item.recipient_name}
                        </Text>{' '}
                        · {item.phone}
                      </Text>
                      <Text style={s.addressStreetText}>{item.address}</Text>

                      {(item.upazila || item.district) && (
                        <Text style={s.addressAreaText}>
                          {[
                            item.upazila ? `উপজেলা: ${item.upazila}` : '',
                            item.district ? `জেলা: ${item.district}` : '',
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      )}

                      {/* Address Actions */}
                      <View style={s.addressActionsRow}>
                        {!item.is_default && (
                          <TouchableOpacity
                            style={s.actionBtnDefault}
                            onPress={() => setDefaultAddress(item.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={s.actionBtnDefaultText}>ডিফল্ট করুন</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={s.actionBtnEdit}
                          onPress={() => startEditAddress(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.actionBtnEditText}>✏️ এডিট</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={s.actionBtnDelete}
                          onPress={() => deleteAddress(item.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.actionBtnDeleteText}>🗑️ ডিলিট</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.emptyAddressNote}>
                  অর্ডার করার সময় আপনার শিপিং ঠিকানা স্বয়ংক্রিয়ভাবে এখানে সেভ হয়ে থাকবে।
                </Text>
              )}
            </View>

            {/* Form to Add / Edit Address */}
            <View style={s.tabContentCard}>
              <View style={s.cardHeaderRow}>
                <Text style={s.cardHeaderTitle}>
                  {editingAddressId ? '✏️ ঠিকানা এডিট করুন' : '+ নতুন ঠিকানা যোগ করুন'}
                </Text>
                {editingAddressId && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingAddressId(null);
                      setAddressForm({
                        label: '',
                        recipient_name: '',
                        phone: '',
                        address: '',
                        district: '',
                        upazila: '',
                        is_default: true,
                      });
                    }}
                  >
                    <Text style={s.cancelEditText}>বাতিল করুন</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.formCol}>
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>ঠিকানার লেবেল (যেমন: বাসা / অফিস)</Text>
                  <TextInput
                    style={s.inputField}
                    placeholder="যেমন: বাসা / অফিস"
                    placeholderTextColor="#94a3b8"
                    value={addressForm.label}
                    onChangeText={(val) => setAddressForm({ ...addressForm, label: val })}
                  />
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>প্রাপকের নাম *</Text>
                  <TextInput
                    style={s.inputField}
                    placeholder="যেমন: রাহিম উদ্দিন"
                    placeholderTextColor="#94a3b8"
                    value={addressForm.recipient_name}
                    onChangeText={(val) => setAddressForm({ ...addressForm, recipient_name: val })}
                  />
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>মোবাইল নম্বর *</Text>
                  <TextInput
                    style={s.inputField}
                    placeholder="01XXXXXXXXX"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={addressForm.phone}
                    onChangeText={(val) => setAddressForm({ ...addressForm, phone: val })}
                  />
                </View>

                {/* District Selector Picker */}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>জেলা নির্বাচন করুন *</Text>
                  <TouchableOpacity
                    style={s.selectorBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectorMode('district');
                      setLocationSearch('');
                      setSelectorModalVisible(true);
                    }}
                  >
                    <Text
                      style={[
                        s.selectorBtnText,
                        !addressForm.district && { color: '#94a3b8' },
                      ]}
                    >
                      {addressForm.district || '-- জেলা বেছে নিন --'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Upazila Selector Picker */}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>উপজেলা / থানা *</Text>
                  <TouchableOpacity
                    style={[
                      s.selectorBtn,
                      !addressForm.district && { backgroundColor: '#f1f5f9' },
                    ]}
                    activeOpacity={0.8}
                    disabled={!addressForm.district}
                    onPress={() => {
                      setSelectorMode('upazila');
                      setLocationSearch('');
                      setSelectorModalVisible(true);
                    }}
                  >
                    <Text
                      style={[
                        s.selectorBtnText,
                        !addressForm.upazila && { color: '#94a3b8' },
                      ]}
                    >
                      {addressForm.upazila ||
                        (addressForm.district
                          ? '-- উপজেলা/থানা বেছে নিন --'
                          : 'আগে জেলা নির্বাচন করুন')}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Detailed Address Textarea */}
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>গ্রাম / সড়ক / বাসা নম্বর (বিস্তারিত ঠিকানা) *</Text>
                  <TextInput
                    style={[s.inputField, s.textAreaField]}
                    multiline
                    numberOfLines={4}
                    placeholder={`বাসা # ১২ (৩য় তলা), রোড # ৪, মিরপুর-১০, ঢাকা।`}
                    placeholderTextColor="#94a3b8"
                    value={addressForm.address}
                    onChangeText={(val) => setAddressForm({ ...addressForm, address: val })}
                  />
                </View>

                <TouchableOpacity
                  style={s.saveAddressBtn}
                  onPress={saveAddress}
                  disabled={savingAddress}
                  activeOpacity={0.85}
                >
                  {savingAddress ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.saveAddressBtnText}>ঠিকানা সংরক্ষণ করুন</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ======================================= */}
        {/* TAB 3: PROFILE SETTINGS                */}
        {/* ======================================= */}
        {activeTab === 'settings' && (
          <View style={s.tabContentCard}>
            <Text style={s.cardHeaderTitle}>⚙️ প্রোফাইল সেটিংস</Text>

            <View style={s.formCol}>
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>আপনার নাম</Text>
                <TextInput
                  style={s.inputField}
                  placeholder="আপনার পূর্ণ নাম"
                  placeholderTextColor="#94a3b8"
                  value={profileName}
                  onChangeText={setProfileName}
                />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>ইমেইল ঠিকানা (Google Account)</Text>
                <TextInput
                  style={[s.inputField, s.inputReadOnly]}
                  value={account.email || ''}
                  editable={false}
                />
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>মোবাইল নম্বর</Text>
                <TextInput
                  style={s.inputField}
                  placeholder="01XXXXXXXXX"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <TouchableOpacity
                style={s.saveProfileBtn}
                onPress={saveProfile}
                disabled={savingProfile}
                activeOpacity={0.85}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.saveProfileBtnText}>প্রোফাইল আপডেট করুন</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Location Modal Picker (District / Upazila) */}
      <Modal
        visible={selectorModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectorModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {selectorMode === 'district' ? 'জেলা বেছে নিন' : 'উপজেলা / থানা বেছে নিন'}
              </Text>
              <TouchableOpacity onPress={() => setSelectorModalVisible(false)}>
                <Ionicons name="close" size={24} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={s.modalSearchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={s.modalSearchInput}
                placeholder="সার্চ করুন..."
                placeholderTextColor="#94a3b8"
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoFocus
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {selectorMode === 'district' ? (
                filteredDistricts.length > 0 ? (
                  filteredDistricts.map((item) => (
                    <TouchableOpacity
                      key={item.district}
                      style={s.modalItemRow}
                      onPress={() => {
                        setAddressForm({
                          ...addressForm,
                          district: item.district,
                          upazila: '', // Reset upazila when district changes
                        });
                        setSelectorModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          s.modalItemText,
                          addressForm.district === item.district && s.modalItemTextActive,
                        ]}
                      >
                        {item.district}
                      </Text>
                      {addressForm.district === item.district && (
                        <Ionicons name="checkmark" size={18} color="#10b981" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={s.noMatchText}>কোনো জেলা পাওয়া যায়নি</Text>
                )
              ) : filteredUpazilas.length > 0 ? (
                filteredUpazilas.map((upazila) => (
                  <TouchableOpacity
                    key={upazila}
                    style={s.modalItemRow}
                    onPress={() => {
                      setAddressForm({
                        ...addressForm,
                        upazila,
                      });
                      setSelectorModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        s.modalItemText,
                        addressForm.upazila === upazila && s.modalItemTextActive,
                      ]}
                    >
                      {upazila}
                    </Text>
                    {addressForm.upazila === upazila && (
                      <Ionicons name="checkmark" size={18} color="#10b981" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={s.noMatchText}>কোনো উপজেলা পাওয়া যায়নি</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },

  // Unauth Screen Styles (Matching Web App)
  unauthScrollContent: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '85%',
  },
  unauthCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    ...shadow,
  },
  portalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 12,
  },
  portalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.8,
  },
  unauthTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center',
  },
  unauthSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    ...shadow,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  featureBox: {
    width: '100%',
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },

  // Authenticated Screen Styles (Matching Web App)
  authScrollContent: {
    padding: 16,
    gap: 16,
  },
  profileBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileTextCol: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  emailText: {
    fontSize: 13,
    color: '#64748b',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 13,
  },

  // Notice Banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
  },
  noticeText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Tab Navigation Bar (Matching Web App)
  tabBar: {
    gap: 8,
    paddingBottom: 4,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItemActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#ffffff',
  },

  // Card Content
  tabContentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadow,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },

  // Order History Styles
  orderList: {
    gap: 16,
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    ...shadow,
  },
  orderCardTop: {
    padding: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDateText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTotalLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },

  // Timeline Visualizer
  timelineContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fbfcfe',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  timelineTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timelineDotActive: {
    backgroundColor: '#10b981',
  },
  timelineDotCurrent: {
    borderWidth: 2,
    borderColor: '#047857',
  },
  timelineStepLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  timelineStepLabelActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // Order Items
  orderItemsList: {
    padding: 12,
    gap: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderItemThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderItemThumb: {
    width: '100%',
    height: '100%',
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 18,
  },
  orderItemQty: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  orderItemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  emptyItemsText: {
    padding: 12,
    fontSize: 12,
    color: '#64748b',
  },

  // Order Card Footer
  orderCardFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  orderAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  orderAddressText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    lineHeight: 16,
  },
  paymentMethodPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },

  // Empty Orders
  emptyOrdersBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyOrdersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyOrdersSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  startShopBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startShopBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Saved Addresses Styles
  addressGrid: {
    gap: 14,
  },
  addressCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  addressCardNormal: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  addressCardDefault: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  addressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressLabelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  defaultPill: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  addressBodyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  addressStreetText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  addressAreaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  addressActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionBtnDefault: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBtnDefaultText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  actionBtnEdit: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  actionBtnDelete: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  actionBtnDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  emptyAddressNote: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },

  // Address & Profile Form
  formCol: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  inputReadOnly: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
  },
  textAreaField: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectorBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorBtnText: {
    fontSize: 14,
    color: '#0f172a',
  },
  cancelEditText: {
    fontSize: 12,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  saveAddressBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveAddressBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  saveProfileBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveProfileBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Modal Selector Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
  },
  modalItemTextActive: {
    fontWeight: '700',
    color: '#10b981',
  },
  noMatchText: {
    padding: 20,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
  },
});

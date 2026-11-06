import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ContactLauncher } from '@/components/ContactLauncher';
import { C, R, shadow } from '@/constants/theme';
import { API, effectivePrice, productImage, taka } from '@/lib/api';
import { useCart } from '@/lib/cart';

const BN_TO_EN_MAP: Record<string, string> = {
  'ঢাকা': 'dhaka', 'ধানমন্ডি': 'dhanmondi', 'গুলশান': 'gulshan', 'বনানী': 'banani', 'উত্তরা': 'uttara',
  'মিরপুর': 'mirpur', 'মোহাম্মদপুর': 'mohammadpur', 'বাড্ডা': 'badda', 'খিলগাঁও': 'khilgaon',
  'যাত্রাবাড়ী': 'jatrabari', 'যাত্রাবাড়ী': 'jatrabari', 'লালবাগ': 'lalbagh', 'মতিঝিল': 'motijheel', 'শাহবাগ': 'shahbagh',
  'পল্টন': 'paltan', 'তেজগাঁও': 'tejgaon', 'রমনা': 'ramna', 'সাভার': 'savar',
  'ধামরাই': 'dhamrai', 'কেরানীগঞ্জ': 'keraniganj', 'গাজীপুর': 'gazipur', 'টঙ্গী': 'tongi',
  'নারায়ণগঞ্জ': 'narayanganj', 'কালিয়াকৈর': 'kaliakair', 'শ্রীপুর': 'sreepur', 'চট্টগ্রাম': 'chittagong',
  'পটিয়া': 'patia', 'হাটহাজারী': 'hathazari', 'কক্সবাজার': 'cox', 'কুমিল্লা': 'cumilla',
  'ফেনী': 'feni', 'নোয়াখালী': 'noakhali', 'সিলেট': 'sylhet', 'রাজশাহী': 'rajshahi',
  'বগুড়া': 'bogra', 'খুলনা': 'khulna', 'যশোর': 'jashore', 'বরিশাল': 'barishal',
  'রংপুর': 'rangpur', 'ময়মনসিংহ': 'mymensingh', 'পাবনা': 'pabna', 'সিরাজগঞ্জ': 'sirajganj',
  'টাঙ্গাইল': 'tangail', 'ফরিদপুর': 'faridpur', 'ব্রাহ্মণবাড়িয়া': 'brahmanbaria', 'চাঁদপুর': 'chandpur',
};

type Opt = { id: string; name: string };

type SavedAddress = {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  district: string;
  upazila?: string;
  is_default: boolean;
};

function normalize(rows: Record<string, unknown>[], level: 'city' | 'zone' | 'area'): Opt[] {
  return rows
    .map((r) => ({
      id: String(r[`${level}_id`] ?? r.id ?? ''),
      name: String(r[`${level}_name`] ?? r.name ?? ''),
    }))
    .filter((o) => o.id && o.name);
}

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.error || data.detail;
    if (!msg && typeof data === 'object' && Object.keys(data).length > 0) {
      msg = Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
    }
    throw new Error(msg || 'অনুরোধ ব্যর্থ হয়েছে।');
  }
  return data;
}

function Picker({
  label,
  value,
  options,
  loading,
  disabled,
  onSelect,
}: {
  label: string;
  value: string;
  options: Opt[];
  loading?: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = options.find((o) => o.id === value)?.name;
  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <View style={{ gap: 5, marginBottom: 10 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        style={[s.input, s.pick, disabled && { opacity: 0.5 }]}
        disabled={disabled}
        onPress={() => setOpen(true)}>
        <Text style={{ color: current ? C.ink : C.muted, flex: 1, fontSize: 13 }} numberOfLines={1}>
          {current || (loading ? 'লোড হচ্ছে…' : 'নির্বাচন করুন')}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={C.forest} />
        ) : (
          <Ionicons name="chevron-down" size={18} color={C.forest} />
        )}
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: C.ivory,
            paddingTop: Platform.OS === 'ios' ? 54 : 30,
          }}>
          <View style={s.mHead}>
            <Text style={s.mTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color={C.forest} />
            </Pressable>
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="খুঁজুন…"
            placeholderTextColor={C.muted}
            style={[s.input, { marginHorizontal: 16 }]}
          />
          <FlatList
            data={filtered}
            keyExtractor={(o) => o.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <Pressable
                style={[s.opt, item.id === value && { backgroundColor: C.cream }]}
                onPress={() => {
                  onSelect(item.id);
                  setOpen(false);
                  setQ('');
                }}>
                <Text style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
                {item.id === value && <Ionicons name="checkmark" size={18} color={C.forest} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export default function Checkout() {
  const router = useRouter();
  const { items, total, clear } = useCart();

  // Contact fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [autoResolving, setAutoResolving] = useState(false);
  const pendingAddrRef = useRef<SavedAddress | null>(null);

  // Courier state
  const [provider, setProvider] = useState('');
  const [cities, setCities] = useState<Opt[]>([]);
  const [zones, setZones] = useState<Opt[]>([]);
  const [areas, setAreas] = useState<Opt[]>([]);
  const [cityId, setCityId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [loadingLoc, setLoadingLoc] = useState({ city: true, zone: false, area: false });
  const [showManualCourier, setShowManualCourier] = useState(false);

  // Delivery quote & order
  const [delivery, setDelivery] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneOrderId, setDoneOrderId] = useState<number | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Load User & Saved Addresses
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('user-token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API}/auth/me/`, { headers });
        if (res.ok) {
          const profile = await res.json();
          if (profile.authenticated) {
            setName(profile.name || '');
            setEmail(profile.email || '');
            setPhone(profile.profile?.phone || '');
            if (Array.isArray(profile.addresses) && profile.addresses.length > 0) {
              setSavedAddresses(profile.addresses);
              const def = profile.addresses.find((a: SavedAddress) => a.is_default) || profile.addresses[0];
              if (def) {
                handleSelectAddress(def);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Load Courier Providers & Cities
  useEffect(() => {
    (async () => {
      try {
        const data = await getJson(`${API}/checkout/couriers/`);
        const p = data.providers?.[0]?.id || '';
        if (!p) throw new Error('ডেলিভারি সার্ভিস এখনো কনফিগার করা হয়নি।');
        setProvider(p);
        const c = await getJson(`${API}/checkout/couriers/${p}/cities/`);
        const loadedCities = normalize(c.results || [], 'city');
        setCities(loadedCities);

        if (pendingAddrRef.current) {
          void autoResolveCourier(pendingAddrRef.current, p, loadedCities);
          pendingAddrRef.current = null;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'কুরিয়ারের সাথে সংযোগ করা যায়নি।');
      } finally {
        setLoadingLoc((l) => ({ ...l, city: false }));
      }
    })();
  }, []);

  // Auto-resolve courier city, zone, area from saved address
  const autoResolveCourier = async (addr: SavedAddress, p: string, cityList: Opt[]) => {
    try {
      setAutoResolving(true);
      setError('');

      const rawDistrict = (addr.district || '').toLowerCase();
      const rawUpazila = (addr.upazila || '').toLowerCase();
      const rawAddress = (addr.address || '').toLowerCase();

      const tokens: string[] = [];
      const addTokens = (str: string) => {
        str.split(/[\s,()\/–—\-]+/).forEach((part) => {
          const trimmed = part.trim();
          if (trimmed.length >= 2) {
            tokens.push(trimmed);
            if (BN_TO_EN_MAP[trimmed]) tokens.push(BN_TO_EN_MAP[trimmed]);
          }
        });
      };
      addTokens(rawDistrict);
      addTokens(rawUpazila);
      addTokens(rawAddress);

      // 1. Match City
      let matchedCity = cityList.find((c) => {
        const cName = c.name.toLowerCase();
        return tokens.some((t) => cName.includes(t) || t.includes(cName));
      });
      if (!matchedCity) {
        matchedCity = cityList.find((c) => c.name.toLowerCase().includes('dhaka')) || cityList[0];
      }
      if (!matchedCity) return;

      setCityId(matchedCity.id);
      setLoadingLoc((l) => ({ ...l, zone: true }));

      // 2. Load and Match Zone
      const zData = await getJson(`${API}/checkout/couriers/${p}/zones/?city_id=${encodeURIComponent(matchedCity.id)}`);
      const zList = normalize(zData.results || [], 'zone');
      setZones(zList);
      setLoadingLoc((l) => ({ ...l, zone: false }));

      if (!zList.length) return;

      const matchedZone =
        zList.find((z) => {
          const zName = z.name.toLowerCase();
          return tokens.some((t) => zName.includes(t) || t.includes(zName));
        }) || zList[0];

      setZoneId(matchedZone.id);
      setLoadingLoc((l) => ({ ...l, area: true }));

      // 3. Load and Match Area
      const aData = await getJson(`${API}/checkout/couriers/${p}/areas/?zone_id=${encodeURIComponent(matchedZone.id)}`);
      const aList = normalize(aData.results || [], 'area');
      setAreas(aList);
      setLoadingLoc((l) => ({ ...l, area: false }));

      if (!aList.length) return;

      const matchedArea =
        aList.find((a) => {
          const aName = a.name.toLowerCase();
          return tokens.some((t) => aName.includes(t) || t.includes(aName));
        }) || aList[0];

      setAreaId(matchedArea.id);
    } catch {
      // ignore
    } finally {
      setAutoResolving(false);
    }
  };

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddrId(addr.id);
    if (addr.recipient_name) setName(addr.recipient_name);
    if (addr.phone) setPhone(addr.phone);
    setAddress([addr.address, addr.upazila, addr.district].filter(Boolean).join(', '));

    if (provider && cities.length > 0) {
      void autoResolveCourier(addr, provider, cities);
    } else {
      pendingAddrRef.current = addr;
    }
  };

  const pickCity = async (id: string) => {
    setCityId(id);
    setZoneId('');
    setAreaId('');
    setZones([]);
    setAreas([]);
    setDelivery(null);
    setError('');
    setLoadingLoc((l) => ({ ...l, zone: true }));
    try {
      const d = await getJson(`${API}/checkout/couriers/${provider}/zones/?city_id=${encodeURIComponent(id)}`);
      setZones(normalize(d.results || [], 'zone'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'জোন লোড করা যায়নি।');
    } finally {
      setLoadingLoc((l) => ({ ...l, zone: false }));
    }
  };

  const pickZone = async (id: string) => {
    setZoneId(id);
    setAreaId('');
    setAreas([]);
    setDelivery(null);
    setError('');
    setLoadingLoc((l) => ({ ...l, area: true }));
    try {
      const d = await getJson(`${API}/checkout/couriers/${provider}/areas/?zone_id=${encodeURIComponent(id)}`);
      setAreas(normalize(d.results || [], 'area'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'এলাকা লোড করা যায়নি।');
    } finally {
      setLoadingLoc((l) => ({ ...l, area: false }));
    }
  };

  // Live delivery quote calculation
  useEffect(() => {
    setDelivery(null);
    if (!provider || !cityId || !zoneId || !areaId || !items.length) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setQuoting(true);
      setError('');
      try {
        const d = await getJson(`${API}/checkout/couriers/quote/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            provider,
            city_id: cityId,
            zone_id: zoneId,
            area_id: areaId,
            items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          }),
        });
        setDelivery(Number(d.delivery_charge));
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : 'ডেলিভারি চার্জ হিসাব করা যায়নি।');
      } finally {
        if (!ctrl.signal.aborted) setQuoting(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [provider, cityId, zoneId, areaId, items]);

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) {
      setCouponError('কুপন কোড লিখুন।');
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await fetch(`${API}/checkout/coupons/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCode.trim(),
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'কুপনটি সঠিক নয় বা মেয়াদ শেষ।');
      setCouponCode(data.coupon_code || couponCode.trim().toUpperCase());
      setCouponDiscount(Number(data.discount_amount || 0));
      setCouponApplied(true);
    } catch (err: any) {
      setCouponError(err.message || 'কুপন প্রয়োগ করা যায়নি।');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const submitOrder = async () => {
    setError('');
    if (!name.trim() || !phone.trim() || !address.trim()) return setError('নাম, ফোন ও ঠিকানা আবশ্যক।');
    if (delivery === null) return setError('এলাকা নির্বাচন করে ডেলিভারি চার্জের জন্য অপেক্ষা করুন।');

    const cityName = cities.find((o) => o.id === cityId)?.name || '';
    const zoneName = zones.find((o) => o.id === zoneId)?.name || '';
    const areaName = areas.find((o) => o.id === areaId)?.name || '';

    const cleanPhone = phone.replace(/\D/g, '') || 'customer';
    const orderEmail = email.trim() || `${cleanPhone}@customer.alorchoya.com`;

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('user-token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const d = await getJson(`${API}/orders/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_name: name.trim(),
          email: orderEmail,
          phone: phone.trim(),
          address: address.trim(),
          coupon_code: couponApplied ? couponCode.trim() : '',
          payment_method: 'cod',
          courier_provider: provider,
          courier_city_id: cityId,
          courier_city_name: cityName,
          courier_zone_id: zoneId,
          courier_zone_name: zoneName,
          courier_area_id: areaId,
          courier_area_name: areaName,
          delivery_charge: delivery,
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        }),
      });
      clear();
      setDoneOrderId(d.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'অর্ডার সম্পন্ন করা যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = Math.max(0, total + (delivery || 0) - couponDiscount);

  if (doneOrderId) {
    return (
      <View style={s.done}>
        <View style={s.doneCircle}>
          <Ionicons name="checkmark" size={48} color={C.ivory} />
        </View>
        <Text style={s.doneTitle}>ধন্যবাদ! আপনার অর্ডার সফল হয়েছে</Text>
        <Text style={s.doneSub}>অর্ডার নম্বর: #{doneOrderId}</Text>
        <Text style={s.doneNote}>
          আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করে অর্ডার কনফার্ম করবেন।
        </Text>
        <View style={{ gap: 10, width: '100%', marginTop: 20 }}>
          <TouchableOpacity
            style={s.doneBtnPrimary}
            onPress={() => router.push({ pathname: '/track-order' })}
            activeOpacity={0.85}>
            <Text style={s.doneBtnPrimaryText}>অর্ডার ট্র্যাক করুন →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.doneBtnGhost}
            onPress={() => router.replace('/')}
            activeOpacity={0.75}>
            <Text style={s.doneBtnGhostText}>হোমে ফিরে যান</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Saved Addresses Section (if logged in) */}
        {savedAddresses.length > 0 && (
          <View style={s.card}>
            <View style={s.secHeaderRow}>
              <Text style={s.secTitle}>📍 সংরক্ষিত ঠিকানা ({savedAddresses.length})</Text>
              <TouchableOpacity onPress={() => router.push('/account')}>
                <Text style={s.manageLink}>ম্যানেজ করুন ➔</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddrId === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[s.addrCard, isSelected && s.addrCardSelected]}
                    onPress={() => handleSelectAddress(addr)}
                    activeOpacity={0.8}>
                    <View style={s.addrCardHead}>
                      <Text style={[s.addrLabel, isSelected && { color: C.forest }]}>
                        {addr.label || 'ঠিকানা'}
                      </Text>
                      {addr.is_default && (
                        <View style={s.defBadge}>
                          <Text style={s.defBadgeText}>ডিফল্ট</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.addrName} numberOfLines={1}>
                      {addr.recipient_name}
                    </Text>
                    <Text style={s.addrPhone}>{addr.phone}</Text>
                    <Text style={s.addrText} numberOfLines={2}>
                      {addr.address}, {addr.district}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Auto-resolved Courier Info Banner */}
            {selectedAddrId && cityId && zoneId && areaId && !autoResolving && (
              <View style={s.autoResolvedBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={s.autoResolvedTitle}>
                    সংরক্ষিত ঠিকানা থেকে কুরিয়ার স্বয়ংক্রিয়ভাবে নির্ধারণ হয়েছে
                  </Text>
                  <Text style={s.autoResolvedSub}>
                    {cities.find((c) => c.id === cityId)?.name} ➔{' '}
                    {zones.find((z) => z.id === zoneId)?.name} ➔{' '}
                    {areas.find((a) => a.id === areaId)?.name}
                  </Text>
                </View>
              </View>
            )}

            {autoResolving && (
              <View style={s.resolvingBanner}>
                <ActivityIndicator size="small" color={C.forest} />
                <Text style={s.resolvingText}>
                  সংরক্ষিত ঠিকানা অনুযায়ী কুরিয়ার লোকেশন যাচাই করা হচ্ছে...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Contact Form Card */}
        <View style={s.card}>
          <Text style={s.secTitle}>অর্ডারকারীর তথ্য</Text>

          <View style={s.field}>
            <Text style={s.label}>আপনার নাম *</Text>
            <TextInput
              style={s.input}
              placeholder="যেমন: মোঃ আব্দুল্লাহ"
              placeholderTextColor={C.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>মোবাইল নম্বর *</Text>
            <TextInput
              style={s.input}
              placeholder="01XXXXXXXXX"
              placeholderTextColor={C.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>ইমেইল (ঐচ্ছিক)</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>ডেলিভারির সম্পূর্ণ ঠিকানা *</Text>
            <TextInput
              style={[s.input, { height: 70, textAlignVertical: 'top', paddingTop: 8 }]}
              placeholder="বাড়ি/ফ্ল্যাট নং, রোড নং, এলাকা..."
              placeholderTextColor={C.muted}
              multiline
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        {/* Courier / Location Section */}
        <View style={s.card}>
          <View style={s.secHeaderRow}>
            <Text style={s.secTitle}>কুরিয়ার ও ডেলিভারি লোকেশন</Text>
            {selectedAddrId && (
              <TouchableOpacity onPress={() => setShowManualCourier(!showManualCourier)}>
                <Text style={s.manageLink}>
                  {showManualCourier ? 'ম্যানুয়াল লুকান' : 'অন্য কুরিয়ার এলাকা'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {(!selectedAddrId || showManualCourier) && (
            <>
              <Picker
                label="শহর / জেলা *"
                value={cityId}
                options={cities}
                loading={loadingLoc.city}
                onSelect={pickCity}
              />
              <Picker
                label="থানা / জোন *"
                value={zoneId}
                options={zones}
                loading={loadingLoc.zone}
                disabled={!cityId}
                onSelect={pickZone}
              />
              <Picker
                label="এলাকা *"
                value={areaId}
                options={areas}
                loading={loadingLoc.area}
                disabled={!zoneId}
                onSelect={(id) => setAreaId(id)}
              />
            </>
          )}

          {/* Delivery Quote Display */}
          {quoting ? (
            <View style={s.quoteRow}>
              <ActivityIndicator size="small" color={C.forest} />
              <Text style={s.quoteLoadingText}>লাইভ ডেলিভারি চার্জ যাচাই করা হচ্ছে...</Text>
            </View>
          ) : delivery !== null ? (
            <View style={s.deliveryBadge}>
              <Text style={s.deliveryBadgeLabel}>ডেলিভারি চার্জ:</Text>
              <Text style={s.deliveryBadgeVal}>{taka(delivery)}</Text>
            </View>
          ) : null}
        </View>

        {/* Order Items & Summary */}
        <View style={s.card}>
          <Text style={s.secTitle}>অর্ডার সামারি</Text>
          {items.map((it) => (
            <View key={it.id} style={s.itemRow}>
              <Image source={{ uri: productImage(it) }} style={s.itemThumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={s.itemName} numberOfLines={1}>
                  {it.name}
                </Text>
                <Text style={s.itemQty}>
                  {it.quantity} × {taka(effectivePrice(it))}
                </Text>
              </View>
              <Text style={s.itemPrice}>{taka(effectivePrice(it) * it.quantity)}</Text>
            </View>
          ))}

          {/* Coupon Input Box */}
          <View style={s.couponBox}>
            <Text style={s.couponLabel}>প্রোমো / কুপন কোড</Text>
            <View style={s.couponInputRow}>
              <TextInput
                style={s.couponInput}
                placeholder="কুপন কোড (যেমন: ALORCHOYA)"
                placeholderTextColor={C.muted}
                value={couponCode}
                onChangeText={setCouponCode}
                editable={!couponApplied}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[s.couponBtn, couponApplied && s.couponBtnApplied]}
                onPress={applyCoupon}
                disabled={couponApplied || validatingCoupon}
                activeOpacity={0.8}>
                {validatingCoupon ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.couponBtnText}>{couponApplied ? 'প্রযুক্ত' : 'আবেদন'}</Text>
                )}
              </TouchableOpacity>
            </View>
            {couponError ? <Text style={s.couponErr}>{couponError}</Text> : null}
            {couponApplied ? (
              <Text style={s.couponSuccess}>✓ কুপন ডিসকাউন্ট যুক্ত করা হয়েছে!</Text>
            ) : null}
          </View>

          <View style={s.divider} />

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>পণ্যের মূল্য:</Text>
            <Text style={s.totalVal}>{taka(total)}</Text>
          </View>

          {couponDiscount > 0 && (
            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: '#059669', fontWeight: '700' }]}>কুপন ছাড়:</Text>
              <Text style={[s.totalVal, { color: '#059669', fontWeight: '800' }]}>
                -{taka(couponDiscount)}
              </Text>
            </View>
          )}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>ডেলিভারি চার্জ:</Text>
            <Text style={s.totalVal}>{delivery !== null ? taka(delivery) : 'হিসাব হচ্ছে…'}</Text>
          </View>

          <View style={[s.totalRow, { marginTop: 6 }]}>
            <Text style={s.grandLabel}>সর্বমোট প্রদেয়:</Text>
            <Text style={s.grandVal}>{taka(grandTotal)}</Text>
          </View>
        </View>

        {error ? <Text style={s.errorBanner}>{error}</Text> : null}

        {/* Submit Order Button */}
        <TouchableOpacity
          style={[s.placeOrderBtn, (submitting || delivery === null) && s.btnDisabled]}
          onPress={submitOrder}
          disabled={submitting || delivery === null}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator color={C.ivory} />
          ) : (
            <Text style={s.placeOrderBtnText}>অর্ডার কনফার্ম করুন ({taka(grandTotal)}) →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  content: {
    padding: 14,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
    marginBottom: 12,
  },
  secHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: C.forest,
  },
  manageLink: {
    fontSize: 12,
    fontWeight: '800',
    color: C.emerald,
  },
  addrCard: {
    width: 200,
    backgroundColor: '#fbf9f4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 10,
  },
  addrCardSelected: {
    borderColor: C.forest,
    backgroundColor: '#f0fdf4',
  },
  addrCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addrLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.ink,
  },
  defBadge: {
    backgroundColor: C.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.forest,
  },
  addrName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  addrPhone: {
    fontSize: 11,
    color: C.muted,
  },
  addrText: {
    fontSize: 11,
    color: C.ink,
    marginTop: 2,
  },
  autoResolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  autoResolvedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  autoResolvedSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginTop: 1,
  },
  resolvingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  resolvingText: {
    fontSize: 12,
    color: C.muted,
  },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: C.forest,
    marginBottom: 5,
  },
  input: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fbf9f4',
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 12,
    fontSize: 13,
    color: C.ink,
  },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.forest,
  },
  opt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1ebd9',
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  quoteLoadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.emerald,
  },
  deliveryBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  deliveryBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  deliveryBadgeVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f7f1e5',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  itemQty: {
    fontSize: 11,
    color: C.muted,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: C.forest,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1ebd9',
    marginVertical: 8,
  },
  couponBox: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1ebd9',
    marginTop: 8,
  },
  couponLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 6,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fbf9f4',
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 12,
    fontSize: 13,
    color: C.ink,
    fontWeight: '700',
  },
  couponBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.forest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponBtnApplied: {
    backgroundColor: '#059669',
  },
  couponBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  couponErr: {
    color: '#b3261e',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  couponSuccess: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 12,
    color: C.muted,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: C.ink,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: C.forest,
  },
  grandVal: {
    fontSize: 18,
    fontWeight: '900',
    color: C.forest,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: '#b3261e',
    padding: 12,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  placeOrderBtn: {
    height: 48,
    borderRadius: R.pill,
    backgroundColor: C.forest,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  placeOrderBtnText: {
    color: C.ivory,
    fontSize: 14,
    fontWeight: '900',
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
  },
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: C.ivory,
  },
  doneCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.forest,
    textAlign: 'center',
  },
  doneSub: {
    fontSize: 15,
    fontWeight: '800',
    color: C.emerald,
    marginTop: 6,
  },
  doneNote: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  doneBtnPrimary: {
    height: 46,
    borderRadius: R.pill,
    backgroundColor: C.forest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnPrimaryText: {
    color: C.ivory,
    fontSize: 14,
    fontWeight: '900',
  },
  doneBtnGhost: {
    height: 46,
    borderRadius: R.pill,
    backgroundColor: '#ece6d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnGhostText: {
    color: C.forest,
    fontSize: 14,
    fontWeight: '800',
  },
});

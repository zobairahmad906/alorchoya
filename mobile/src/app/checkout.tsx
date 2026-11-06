import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { C, R } from '@/constants/theme';
import { API, effectivePrice, productImage, taka } from '@/lib/api';
import { useCart } from '@/lib/cart';

type Opt = { id: string; name: string };

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
  if (!res.ok) throw new Error(data.error || data.detail || 'অনুরোধ ব্যর্থ হয়েছে।');
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
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable style={[s.input, s.pick, disabled && { opacity: 0.5 }]} disabled={disabled} onPress={() => setOpen(true)}>
        <Text style={{ color: current ? C.ink : C.muted, flex: 1 }} numberOfLines={1}>
          {current || (loading ? 'লোড হচ্ছে…' : 'নির্বাচন করুন')}
        </Text>
        {loading ? <ActivityIndicator size="small" color={C.forest} /> : <Ionicons name="chevron-down" size={18} color={C.forest} />}
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: C.ivory, paddingTop: Platform.OS === 'ios' ? 54 : 30 }}>
          <View style={s.mHead}>
            <Text style={s.mTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color={C.forest} />
            </Pressable>
          </View>
          <TextInput value={q} onChangeText={setQ} placeholder="খুঁজুন…" placeholderTextColor={C.muted} style={[s.input, { marginHorizontal: 16 }]} />
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
                <Text style={{ color: C.ink, fontSize: 15 }}>{item.name}</Text>
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [provider, setProvider] = useState('');
  const [cities, setCities] = useState<Opt[]>([]);
  const [zones, setZones] = useState<Opt[]>([]);
  const [areas, setAreas] = useState<Opt[]>([]);
  const [cityId, setCityId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [loadingLoc, setLoadingLoc] = useState({ city: true, zone: false, area: false });

  const [delivery, setDelivery] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getJson(`${API}/checkout/couriers/`);
        const p = data.providers?.[0]?.id || '';
        if (!p) throw new Error('ডেলিভারি সার্ভিস এখনো কনফিগার করা হয়নি।');
        setProvider(p);
        const c = await getJson(`${API}/checkout/couriers/${p}/cities/`);
        setCities(normalize(c.results || [], 'city'));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'কুরিয়ারের সাথে সংযোগ করা যায়নি।');
      } finally {
        setLoadingLoc((l) => ({ ...l, city: false }));
      }
    })();
  }, []);

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

  // Live delivery quote
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
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [provider, cityId, zoneId, areaId, items]);

  const submit = async () => {
    setError('');
    if (!name.trim() || !phone.trim() || !address.trim()) return setError('নাম, ফোন ও ঠিকানা আবশ্যক।');
    if (delivery === null) return setError('এলাকা নির্বাচন করে ডেলিভারি চার্জের জন্য অপেক্ষা করুন।');
    const cityName = cities.find((o) => o.id === cityId)?.name || '';
    const zoneName = zones.find((o) => o.id === zoneId)?.name || '';
    const areaName = areas.find((o) => o.id === areaId)?.name || '';
    setSubmitting(true);
    try {
      const d = await getJson(`${API}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: [address.trim(), areaName, zoneName, cityName].filter(Boolean).join(', '),
          coupon_code: '',
          payment_method: 'cod',
          courier_provider: provider,
          courier_city_id: cityId,
          courier_city_name: cityName,
          courier_zone_id: zoneId,
          courier_zone_name: zoneName,
          courier_area_id: areaId,
          courier_area_name: areaName,
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        }),
      });
      clear();
      setDone(d.order_number || `#${d.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'অর্ডার সম্পন্ন করা যায়নি।';
      setError(msg);
      Alert.alert('অর্ডার ব্যর্থ', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={s.center}>
        <Ionicons name="checkmark-circle" size={72} color={C.emerald} />
        <Text style={s.doneT}>অর্ডার সম্পন্ন হয়েছে!</Text>
        <Text style={{ color: C.muted }}>অর্ডার নম্বর: {done}</Text>
        <Pressable style={[s.solid, { marginTop: 18 }]} onPress={() => router.replace('/')}>
          <Text style={s.solidT}>হোমে ফিরে যান</Text>
        </Pressable>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={s.center}>
        <Text style={s.doneT}>আপনার কার্ট খালি</Text>
        <Pressable style={[s.solid, { marginTop: 14 }]} onPress={() => router.replace('/shop')}>
          <Text style={s.solidT}>শপে যান</Text>
        </Pressable>
      </View>
    );
  }

  const grand = total + (delivery ?? 0);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.ivory }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h}>আপনার তথ্য</Text>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>নাম *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="আপনার পূর্ণ নাম" placeholderTextColor={C.muted} />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>মোবাইল নম্বর *</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="01XXXXXXXXX" placeholderTextColor={C.muted} />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>ইমেইল (ঐচ্ছিক)</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@email.com" placeholderTextColor={C.muted} />
        </View>

        <Text style={[s.h, { marginTop: 8 }]}>ডেলিভারি ঠিকানা</Text>
        <Picker label="শহর / জেলা *" value={cityId} options={cities} loading={loadingLoc.city} onSelect={pickCity} />
        <Picker label="জোন / উপজেলা *" value={zoneId} options={zones} loading={loadingLoc.zone} disabled={!cityId} onSelect={pickZone} />
        <Picker label="এলাকা *" value={areaId} options={areas} loading={loadingLoc.area} disabled={!zoneId} onSelect={setAreaId} />
        <View style={{ gap: 6 }}>
          <Text style={s.label}>বিস্তারিত ঠিকানা *</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} multiline value={address} onChangeText={setAddress} placeholder="বাসা/রোড/ল্যান্ডমার্ক" placeholderTextColor={C.muted} />
        </View>

        <Text style={[s.h, { marginTop: 8 }]}>অর্ডার সারাংশ</Text>
        <View style={s.card}>
          {items.map((i) => {
            const uri = productImage(i);
            return (
              <View key={i.id} style={s.line}>
                {uri ? <Image source={{ uri }} style={s.thumb} contentFit="cover" /> : <View style={[s.thumb, { backgroundColor: C.cream }]} />}
                <Text style={{ flex: 1, color: C.ink, fontWeight: '600' }} numberOfLines={2}>
                  {i.name} × {i.quantity}
                </Text>
                <Text style={{ fontWeight: '800', color: C.forest }}>{taka(effectivePrice(i) * i.quantity)}</Text>
              </View>
            );
          })}
          <View style={s.sep} />
          <View style={s.sum}>
            <Text style={s.sumL}>সাবটোটাল</Text>
            <Text style={s.sumV}>{taka(total)}</Text>
          </View>
          <View style={s.sum}>
            <Text style={s.sumL}>ডেলিভারি চার্জ</Text>
            {quoting ? <ActivityIndicator size="small" color={C.forest} /> : <Text style={s.sumV}>{delivery === null ? '—' : taka(delivery)}</Text>}
          </View>
          <View style={s.sum}>
            <Text style={s.sumL}>পেমেন্ট</Text>
            <Text style={s.sumV}>ক্যাশ অন ডেলিভারি</Text>
          </View>
        </View>

        {!!error && <Text style={s.err}>{error}</Text>}
      </ScrollView>

      <View style={s.foot}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.muted, fontSize: 12 }}>সর্বমোট</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.forest }}>{taka(grand)}</Text>
        </View>
        <Pressable style={[s.solid, { paddingHorizontal: 26 }, submitting && { opacity: 0.6 }]} disabled={submitting} onPress={submit}>
          {submitting ? <ActivityIndicator color={C.white} /> : <Text style={s.solidT}>অর্ডার নিশ্চিত করুন</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: C.ivory },
  doneT: { fontSize: 20, fontWeight: '800', color: C.forest },
  h: { fontSize: 18, fontWeight: '800', color: C.forest },
  label: { fontWeight: '700', color: C.forest, fontSize: 13 },
  input: { height: 48, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, paddingHorizontal: 14, fontSize: 15, color: C.ink },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  mTitle: { fontSize: 20, fontWeight: '800', color: C.forest },
  opt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: R.sm },
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 14, gap: 10, borderWidth: 1, borderColor: C.line },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 46, height: 46, borderRadius: R.sm },
  sep: { height: 1, backgroundColor: C.line },
  sum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumL: { color: C.muted },
  sumV: { fontWeight: '800', color: C.ink },
  err: { color: C.danger, fontWeight: '600' },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 20, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  solid: { backgroundColor: C.forest, height: 48, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  solidT: { color: C.white, fontWeight: '800', fontSize: 14 },
});


import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { C, R } from '@/constants/theme';
import { get, img, discountPercent, effectivePrice, taka, type Product } from '@/lib/api';
import { useCart } from '@/lib/cart';

const W = Dimensions.get('window').width;

export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { add } = useCart();
  const [p, setP] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [idx, setIdx] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    get<Product | null>(`/products/${slug}/`, null).then(setP);
  }, [slug]);

  if (!p) {
    return (
      <View style={s.center}>
        <Text style={{ color: C.muted }}>লোড হচ্ছে…</Text>
      </View>
    );
  }

  const gallery = (p.images?.length ? p.images : []).map((i) => img(i.hero_mobile || i.hero_desktop || i.image));
  const off = discountPercent(p);
  const out = p.stock <= 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={{ width: W, height: W, backgroundColor: C.cream }}>
          <FlatList
            data={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: W, height: W }} contentFit="cover" />
            )}
            ListEmptyComponent={<View style={{ width: W, height: W }} />}
          />
          {gallery.length > 1 && (
            <View style={s.dots}>
              {gallery.map((_, i) => (
                <View key={i} style={[s.dot, i === idx && s.dotOn]} />
              ))}
            </View>
          )}
          {off > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeT}>-{off}%</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          <Text style={s.cat}>{p.category?.name}</Text>
          <Text style={s.name}>{p.name}</Text>
          {!!p.total_reviews && (
            <Text style={s.rating}>
              ★ {p.average_rating} <Text style={{ color: C.muted }}>({p.total_reviews} রিভিউ)</Text>
            </Text>
          )}
          <View style={s.priceRow}>
            <Text style={s.price}>{taka(effectivePrice(p))}</Text>
            {off > 0 && <Text style={s.old}>{taka(Number(p.price))}</Text>}
          </View>
          <Text style={[s.stock, { color: out ? C.danger : C.emerald }]}>
            {out ? 'স্টকে নেই' : `স্টকে আছে (${p.stock}টি)`}
          </Text>

          {!!p.description && (
            <>
              <Text style={s.h3}>বিবরণ</Text>
              <Text style={s.desc}>{p.description.replace(/[#*>`]/g, '')}</Text>
            </>
          )}
        </View>
      </ScrollView>

      <View style={s.bar}>
        <View style={s.qty}>
          <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} hitSlop={8}>
            <Ionicons name="remove" size={18} color={C.forest} />
          </Pressable>
          <Text style={s.qtyT}>{qty}</Text>
          <Pressable onPress={() => setQty((q) => Math.min(q + 1, Math.max(p.stock, 1)))} hitSlop={8}>
            <Ionicons name="add" size={18} color={C.forest} />
          </Pressable>
        </View>
        <Pressable
          disabled={out}
          style={[s.btn, s.ghost, out && { opacity: 0.45 }]}
          onPress={() => {
            add(p, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 1400);
          }}>
          <Text style={s.ghostT}>{added ? '✓ যোগ হয়েছে' : 'কার্টে যোগ'}</Text>
        </Pressable>
        <Pressable
          disabled={out}
          style={[s.btn, s.solid, out && { opacity: 0.45 }]}
          onPress={() => {
            add(p, qty);
            router.push('/checkout');
          }}>
          <Text style={s.solidT}>অর্ডার করুন</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ivory },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { width: 18, backgroundColor: C.white },
  badge: { position: 'absolute', top: 14, left: 14, backgroundColor: C.caramel, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5 },
  badgeT: { color: C.white, fontWeight: '800' },
  body: { padding: 18, gap: 6 },
  cat: { color: C.muted, fontSize: 12, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: C.forest },
  rating: { color: C.star, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
  price: { fontSize: 26, fontWeight: '800', color: C.forest },
  old: { fontSize: 15, color: C.muted, textDecorationLine: 'line-through' },
  stock: { fontWeight: '700', fontSize: 13 },
  h3: { marginTop: 16, fontSize: 16, fontWeight: '800', color: C.forest },
  desc: { color: '#374151', lineHeight: 22, fontSize: 14 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 18, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, height: 46, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line },
  qtyT: { fontWeight: '800', minWidth: 18, textAlign: 'center', color: C.ink },
  btn: { flex: 1, height: 46, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 1.5, borderColor: C.forest },
  ghostT: { color: C.forest, fontWeight: '800', fontSize: 13 },
  solid: { backgroundColor: C.forest },
  solidT: { color: C.white, fontWeight: '800', fontSize: 13 },
});


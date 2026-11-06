import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { C, R, shadow } from '@/constants/theme';
import { effectivePrice, productImage, taka } from '@/lib/api';
import { useCart } from '@/lib/cart';

export default function CartScreen() {
  const router = useRouter();
  const { items, total, setQty, remove } = useCart();

  if (!items.length) {
    return (
      <View style={s.empty}>
        <Ionicons name="bag-handle-outline" size={56} color={C.sage} />
        <Text style={s.emptyT}>আপনার কার্ট খালি</Text>
        <Pressable style={s.solid} onPress={() => router.push('/shop')}>
          <Text style={s.solidT}>কেনাকাটা শুরু করুন</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {items.map((it) => {
          const uri = productImage(it);
          return (
            <View key={it.id} style={s.row}>
              {uri ? <Image source={{ uri }} style={s.thumb} contentFit="cover" /> : <View style={[s.thumb, { backgroundColor: C.cream }]} />}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.name} numberOfLines={2}>
                  {it.name}
                </Text>
                <Text style={s.price}>{taka(effectivePrice(it))}</Text>
                <View style={s.qtyRow}>
                  <Pressable style={s.qBtn} onPress={() => setQty(it.id, it.quantity - 1)}>
                    <Ionicons name="remove" size={16} color={C.forest} />
                  </Pressable>
                  <Text style={s.qty}>{it.quantity}</Text>
                  <Pressable
                    style={s.qBtn}
                    onPress={() => setQty(it.id, Math.min(it.quantity + 1, Math.max(it.stock, 1)))}>
                    <Ionicons name="add" size={16} color={C.forest} />
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={() => remove(it.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={20} color={C.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={s.foot}>
        <View style={{ flex: 1 }}>
          <Text style={s.subLabel}>সাবটোটাল</Text>
          <Text style={s.total}>{taka(total)}</Text>
        </View>
        <Pressable style={[s.solid, { paddingHorizontal: 28 }]} onPress={() => router.push('/checkout')}>
          <Text style={s.solidT}>চেকআউট</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: C.ivory },
  emptyT: { fontSize: 18, fontWeight: '800', color: C.forest },
  row: { flexDirection: 'row', gap: 12, backgroundColor: C.white, borderRadius: R.lg, padding: 10, ...shadow },
  thumb: { width: 84, height: 84, borderRadius: R.md },
  name: { fontWeight: '700', color: C.ink, fontSize: 14 },
  price: { fontWeight: '800', color: C.forest, fontSize: 15 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  qBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: C.forest, alignItems: 'center', justifyContent: 'center' },
  qty: { fontWeight: '800', minWidth: 20, textAlign: 'center', color: C.ink },
  foot: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  subLabel: { color: C.muted, fontSize: 12 },
  total: { fontSize: 22, fontWeight: '800', color: C.forest },
  solid: { backgroundColor: C.forest, height: 48, borderRadius: R.pill, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  solidT: { color: C.white, fontWeight: '800', fontSize: 15 },
});


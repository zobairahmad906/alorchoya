import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ContactLauncher } from '@/components/ContactLauncher';
import { MobileHeader } from '@/components/Header';
import { C, R, shadow } from '@/constants/theme';
import { effectivePrice, productImage, taka } from '@/lib/api';
import { useCart } from '@/lib/cart';

export default function CartScreen() {
  const router = useRouter();
  const { items, total, setQty, remove } = useCart();

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <MobileHeader />

      {!items.length ? (
        <View style={s.empty}>
          <Ionicons name="bag-handle-outline" size={64} color={C.sage} />
          <Text style={s.emptyT}>আপনার কার্ট খালি</Text>
          <Text style={s.emptySub}>পছন্দের খাঁটি পণ্য যুক্ত করতে শপ ব্রাউজ করুন।</Text>
          <TouchableOpacity
            style={s.solid}
            onPress={() => router.push('/shop')}
            activeOpacity={0.85}>
            <Text style={s.solidT}>কেনাকাটা শুরু করুন →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 14, paddingBottom: 20, gap: 10 }}
            showsVerticalScrollIndicator={false}>
            <View style={s.cartHeaderRow}>
              <Text style={s.cartHeaderTitle}>আপনার কার্টের পণ্যসমূহ ({items.length})</Text>
            </View>

            {items.map((it) => {
              const uri = productImage(it);
              return (
                <View key={it.id} style={s.row}>
                  {uri ? (
                    <Image source={{ uri }} style={s.thumb} contentFit="cover" />
                  ) : (
                    <View style={[s.thumb, { backgroundColor: C.cream }]}>
                      <Text style={{ fontSize: 24 }}>আ</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.name} numberOfLines={2}>
                      {it.name}
                    </Text>
                    <Text style={s.price}>{taka(effectivePrice(it))}</Text>
                    <View style={s.qtyRow}>
                      <TouchableOpacity
                        style={s.qBtn}
                        onPress={() => setQty(it.id, it.quantity - 1)}>
                        <Ionicons name="remove" size={16} color={C.forest} />
                      </TouchableOpacity>
                      <Text style={s.qty}>{it.quantity}</Text>
                      <TouchableOpacity
                        style={s.qBtn}
                        onPress={() =>
                          setQty(it.id, Math.min(it.quantity + 1, Math.max(it.stock, 1)))
                        }>
                        <Ionicons name="add" size={16} color={C.forest} />
                      </TouchableOpacity>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity onPress={() => remove(it.id)} hitSlop={10}>
                        <Ionicons name="trash-outline" size={20} color={C.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={s.foot}>
            <View style={{ flex: 1 }}>
              <Text style={s.subLabel}>মোট প্রদেয় (সাবটোটাল)</Text>
              <Text style={s.total}>{taka(total)}</Text>
            </View>
            <TouchableOpacity
              style={s.solid}
              onPress={() => router.push('/checkout')}
              activeOpacity={0.85}>
              <Text style={s.solidT}>চেকআউট করুন →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: C.ivory,
  },
  emptyT: {
    fontSize: 18,
    fontWeight: '900',
    color: C.forest,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  cartHeaderRow: {
    paddingBottom: 4,
  },
  cartHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.forest,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    color: C.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  price: {
    fontWeight: '900',
    color: C.forest,
    fontSize: 15,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
    color: C.ink,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
    ...shadow,
  },
  subLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  total: {
    fontSize: 20,
    fontWeight: '900',
    color: C.forest,
  },
  solid: {
    backgroundColor: C.forest,
    height: 46,
    borderRadius: R.pill,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  solidT: {
    color: C.white,
    fontWeight: '900',
    fontSize: 14,
  },
});

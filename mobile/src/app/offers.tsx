import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ContactLauncher } from '@/components/ContactLauncher';
import { MobileHeader } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { C, R } from '@/constants/theme';
import { get, type Product } from '@/lib/api';

export default function OffersScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Product[]>('/products/', [])
      .then((items) => {
        const discounted = items.filter((p) => p.discount_price && Number(p.discount_price) > 0);
        setProducts(discounted);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <MobileHeader />

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.headingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
                <Ionicons name="arrow-back" size={22} color={C.forest} />
              </TouchableOpacity>
              <Text style={s.kicker}>বিশেষ অফার</Text>
            </View>
            <Text style={s.title}>অফার ও ডিসকাউন্ট</Text>
            <Text style={s.sub}>সীমিত সময়ের জন্য নির্বাচিত পণ্যে সাশ্রয়ী দাম।</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: '50%', padding: 5 }}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={s.centerBox}>
              <ActivityIndicator size="large" color={C.forest} />
              <Text style={{ marginTop: 10, color: C.muted }}>অফার খোঁজা হচ্ছে...</Text>
            </View>
          ) : (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🏷️</Text>
              <Text style={s.emptyTitle}>এই মুহূর্তে কোনো বিশেষ অফার নেই</Text>
              <Text style={s.emptySub}>নতুন অফার ও ছাড়ে পণ্য পেতে শীঘ্রই আবার চেক করুন।</Text>
              <TouchableOpacity
                style={s.shopBtn}
                onPress={() => router.push('/shop')}
                activeOpacity={0.85}>
                <Text style={s.shopBtnText}>সব পণ্য দেখুন →</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  content: {
    padding: 10,
    paddingBottom: 90,
  },
  headingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b83f4b',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: C.forest,
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },
  centerBox: {
    padding: 50,
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.line,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.forest,
  },
  emptySub: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  shopBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.forest,
    borderRadius: R.pill,
  },
  shopBtnText: {
    color: C.ivory,
    fontSize: 13,
    fontWeight: '800',
  },
});


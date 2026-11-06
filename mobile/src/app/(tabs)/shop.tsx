import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { C, R } from '@/constants/theme';
import { get, type Product } from '@/lib/api';

export default function Shop() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Product[]>('/products/', []).then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setCat(params.category || '');
  }, [params.category]);

  const cats = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => p.category?.slug && m.set(p.category.slug, p.category.name));
    return Array.from(m, ([slug, name]) => ({ slug, name }));
  }, [products]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter(
      (p) => (!cat || p.category?.slug === cat) && (!term || p.name.toLowerCase().includes(term)),
    );
  }, [products, q, cat]);

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <View style={s.searchWrap}>
        <Ionicons name="search" size={20} color={C.forest} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="পণ্য খুঁজুন…"
          placeholderTextColor={C.muted}
          style={s.input}
          returnKeyType="search"
        />
        {!!q && (
          <Pressable onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </Pressable>
        )}
      </View>

      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {[{ slug: '', name: 'সব' }, ...cats].map((c) => (
            <Pressable key={c.slug || 'all'} onPress={() => setCat(c.slug)} style={[s.chip, cat === c.slug && s.chipOn]}>
              <Text style={[s.chipText, cat === c.slug && s.chipTextOn]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={list}
        numColumns={2}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 10, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={{ width: '50%', padding: 6 }}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>{loading ? 'লোড হচ্ছে…' : 'কোনো পণ্য পাওয়া যায়নি।'}</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: R.pill,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
  },
  input: { flex: 1, fontSize: 15, color: C.ink },
  chips: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: R.pill, justifyContent: 'center', borderWidth: 1, borderColor: C.line, backgroundColor: C.white },
  chipOn: { backgroundColor: C.forest, borderColor: C.forest },
  chipText: { color: C.forest, fontWeight: '700', fontSize: 13 },
  chipTextOn: { color: C.white },
  empty: { textAlign: 'center', color: C.muted, marginTop: 40 },
});


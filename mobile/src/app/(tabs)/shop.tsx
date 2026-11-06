import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CatalogToolsModal, type FilterValues } from '@/components/CatalogToolsModal';
import { ContactLauncher } from '@/components/ContactLauncher';
import { MobileHeader } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { C, R } from '@/constants/theme';
import { get, type Product } from '@/lib/api';

export default function Shop() {
  const params = useLocalSearchParams<{ category?: string; search?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Advanced Filters
  const [filters, setFilters] = useState<FilterValues>({
    category: 'all',
    sort: 'popular',
    minPrice: '',
    maxPrice: '',
    discountOnly: false,
    stockOnly: false,
  });

  useEffect(() => {
    get<Product[]>('/products/', []).then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (params.category) {
      setCat(params.category);
      setFilters((prev) => ({ ...prev, category: params.category || 'all' }));
    }
    if (params.search) {
      setQ(params.search);
    }
  }, [params.category, params.search]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.category?.slug && map.set(p.category.slug, p.category.name));
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [products]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCat(newFilters.category);
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      sort: 'popular',
      minPrice: '',
      maxPrice: '',
      discountOnly: false,
      stockOnly: false,
    });
    setCat('all');
    setQ('');
  };

  const filteredAndSortedList = useMemo(() => {
    const term = q.trim().toLowerCase();
    const minP = filters.minPrice ? Number(filters.minPrice) : null;
    const maxP = filters.maxPrice ? Number(filters.maxPrice) : null;

    let result = products.filter((p) => {
      // Category filter
      if (cat !== 'all' && p.category?.slug !== cat) return false;
      // Search term
      if (term && !p.name.toLowerCase().includes(term) && !p.description?.toLowerCase().includes(term)) {
        return false;
      }
      // Price
      const effectiveP = Number(p.discount_price || p.price);
      if (minP !== null && effectiveP < minP) return false;
      if (maxP !== null && effectiveP > maxP) return false;
      // Discount
      if (filters.discountOnly && (!p.discount_price || Number(p.discount_price) <= 0)) return false;
      // Stock
      if (filters.stockOnly && p.stock <= 0) return false;

      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      const priceA = Number(a.discount_price || a.price);
      const priceB = Number(b.discount_price || b.price);
      if (filters.sort === 'low') return priceA - priceB;
      if (filters.sort === 'high') return priceB - priceA;
      if (filters.sort === 'discount') {
        const diffA = a.discount_price ? Number(a.price) - Number(a.discount_price) : 0;
        const diffB = b.discount_price ? Number(b.price) - Number(b.discount_price) : 0;
        return diffB - diffA;
      }
      // Popular (featured first)
      return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    });

    return result;
  }, [products, q, cat, filters]);

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <MobileHeader />

      {/* Search Input Bar */}
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
          <Pressable onPress={() => setQ('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={C.muted} />
          </Pressable>
        )}
      </View>

      {/* Category Pills Slider */}
      <View style={{ height: 44, marginBottom: 4 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <TouchableOpacity
            onPress={() => {
              setCat('all');
              setFilters((prev) => ({ ...prev, category: 'all' }));
            }}
            style={[s.chip, cat === 'all' && s.chipOn]}>
            <Text style={[s.chipText, cat === 'all' && s.chipTextOn]}>সব পণ্য</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.slug}
              onPress={() => {
                setCat(c.slug);
                setFilters((prev) => ({ ...prev, category: c.slug }));
              }}
              style={[s.chip, cat === c.slug && s.chipOn]}>
              <Text style={[s.chipText, cat === c.slug && s.chipTextOn]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredAndSortedList}
        numColumns={2}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 8, paddingBottom: 90 }}
        renderItem={({ item }) => (
          <View style={{ width: '50%', padding: 5 }}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={C.forest} />
              <Text style={{ marginTop: 10, color: C.muted }}>লোড হচ্ছে…</Text>
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
              <Text style={s.empty}>কোনো পণ্য পাওয়া যায়নি।</Text>
            </View>
          )
        }
      />

      {/* Filter FAB & Modal */}
      <CatalogToolsModal
        categories={categories}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* WhatsApp & Messenger Floating Launcher */}
      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: R.pill,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
  },
  input: {
    flex: 1,
    color: C.ink,
    fontSize: 13,
  },
  chips: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: '#ece6d8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOn: {
    backgroundColor: C.forest,
    borderColor: C.gold,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.forest,
  },
  chipTextOn: {
    color: C.ivory,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: C.muted,
  },
});

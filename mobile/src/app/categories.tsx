import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { C, R, shadow } from '@/constants/theme';
import { get, img, type Product } from '@/lib/api';

type CategoryItem = {
  name: string;
  slug: string;
  image?: string;
  count: number;
};

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Product[]>('/products/', [])
      .then((products) => {
        const catMap = new Map<string, CategoryItem>();
        for (const p of products) {
          if (!p.category?.slug) continue;
          const primaryImg = img(
            p.images?.find((i) => i.is_primary)?.card_image ||
              p.images?.find((i) => i.is_primary)?.image ||
              p.images?.[0]?.image,
          );
          const existing = catMap.get(p.category.slug);
          if (existing) {
            existing.count += 1;
            if (!existing.image && primaryImg) existing.image = primaryImg;
          } else {
            catMap.set(p.category.slug, {
              name: p.category.name,
              slug: p.category.slug,
              image: primaryImg,
              count: 1,
            });
          }
        }
        setCategories(Array.from(catMap.values()));
      })
      .finally(() => setLoading(false));
  }, []);

  const toBn = (n: number) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <MobileHeader />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.slug}
        numColumns={3}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.headingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
                <Ionicons name="arrow-back" size={22} color={C.forest} />
              </TouchableOpacity>
              <Text style={s.kicker}>আলোর ছোঁয়া মার্ট</Text>
            </View>
            <Text style={s.title}>সব ক্যাটাগরি</Text>
            <Text style={s.sub}>আপনার পছন্দের পণ্য খুঁজে নিন ক্যাটাগরি অনুযায়ী।</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.catCard}
            onPress={() => router.push({ pathname: '/shop', params: { category: item.slug } })}
            activeOpacity={0.8}>
            <View style={s.avatarWrap}>
              <View style={s.avatarInner}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={s.avatarImg} contentFit="cover" />
                ) : (
                  <Text style={s.glyph}>{item.name.slice(0, 1)}</Text>
                )}
              </View>
            </View>
            <Text style={s.catName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={s.catCount}>{toBn(item.count)}টি পণ্য</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={s.centerBox}>
              <ActivityIndicator size="large" color={C.forest} />
              <Text style={{ marginTop: 10, color: C.muted }}>ক্যাটাগরি লোড হচ্ছে...</Text>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', padding: 30, color: C.muted }}>
              কোনো ক্যাটাগরি পাওয়া যায়নি।
            </Text>
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    color: C.forest,
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
  catCard: {
    width: '33.33%',
    alignItems: 'center',
    padding: 8,
    marginBottom: 12,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: C.line,
    padding: 3,
    marginBottom: 6,
    ...shadow,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: '#f7f1e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  glyph: {
    fontSize: 26,
    fontWeight: '900',
    color: C.forest,
  },
  catName: {
    fontSize: 12,
    fontWeight: '800',
    color: C.forest,
    textAlign: 'center',
  },
  catCount: {
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
  },
  centerBox: {
    padding: 50,
    alignItems: 'center',
  },
});


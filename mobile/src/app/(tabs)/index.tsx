import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { ContactLauncher } from '@/components/ContactLauncher';
import { MobileHeader } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { C, R, shadow } from '@/constants/theme';
import {
  discountPercent,
  get,
  img,
  productImage,
  taka,
  WHATSAPP,
  type HeroSlide,
  type Product,
  type Review,
} from '@/lib/api';

const FALLBACK_REVIEWS: Review[] = [
  { id: -1, customer_name: 'নুসরাত জাহান', rating: 5, comment: 'পণ্যটির কোয়ালিটি অসাধারণ, ডেলিভারিও দ্রুত পেয়েছি।' },
  { id: -2, customer_name: 'রাকিবুল হাসান', rating: 5, comment: 'দাম অনুযায়ী পণ্যের মান খুবই ভালো, আবার অর্ডার করব।' },
  { id: -3, customer_name: 'ফারহানা আক্তার', rating: 5, comment: 'খাঁটি ও প্রাকৃতিক পণ্য, প্যাকেজিং দারুণ ছিল।' },
];

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const heroRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    const [p, h, r] = await Promise.all([
      get<Product[]>('/products/', []),
      get<HeroSlide[]>('/hero-slides/', []),
      get<Review[]>('/reviews/featured/', []),
    ]);
    setProducts(p);
    setSlides(h);
    setReviews(r);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const discounted = useMemo(() => products.filter((p) => discountPercent(p) > 0), [products]);

  // Extract categories with counts
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; image?: string; count: number }>();
    for (const p of products) {
      if (!p.category?.slug) continue;
      const primaryImg = productImage(p);
      const existing = map.get(p.category.slug);
      if (existing) {
        existing.count += 1;
        if (!existing.image && primaryImg) existing.image = primaryImg;
      } else {
        map.set(p.category.slug, {
          name: p.category.name,
          slug: p.category.slug,
          image: primaryImg,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const totalProductCount = products.length;

  const toBn = (n: number) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

  const heroItems = useMemo(() => {
    if (slides.length) {
      return slides.map((s) => ({
        key: `s${s.id}`,
        eyebrow: s.eyebrow,
        title: s.title,
        sub: s.subtitle,
        cta: s.button_text || 'এখনই কিনুন',
        image: img(s.mobile_image || s.image),
        slug: s.product_slug || undefined,
      }));
    }
    const base = (products.filter((p) => p.is_featured).length
      ? products.filter((p) => p.is_featured)
      : products
    ).slice(0, 5);
    return base.map((p) => ({
      key: `p${p.id}`,
      eyebrow: p.category?.name,
      title: p.name,
      sub: '',
      cta: 'এখনই কিনুন',
      image: productImage(p),
      slug: p.slug,
    }));
  }, [slides, products]);

  useEffect(() => {
    if (heroItems.length < 2) return;
    const t = setInterval(() => {
      setSlideIdx((i) => {
        const n = (i + 1) % heroItems.length;
        heroRef.current?.scrollToIndex({ index: n, animated: true });
        return n;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [heroItems.length]);

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <MobileHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.forest} />
        }>
        {/* 1. Hero Carousel */}
        {heroItems.length > 0 && (
          <View style={s.heroWrap}>
            <FlatList
              ref={heroRef}
              data={heroItems}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / width);
                setSlideIdx(i);
              }}
              keyExtractor={(it) => it.key}
              renderItem={({ item }) => (
                <View style={[s.heroSlide, { width }]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={s.heroImg} contentFit="cover" />
                  ) : (
                    <View style={[s.heroImg, { backgroundColor: C.forest }]} />
                  )}
                  <View style={s.heroGrad} />
                  <View style={s.heroTextWrap}>
                    {item.eyebrow ? <Text style={s.heroEyebrow}>{item.eyebrow}</Text> : null}
                    <Text style={s.heroTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.sub ? (
                      <Text style={s.heroSub} numberOfLines={2}>
                        {item.sub}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      style={s.heroCta}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (item.slug) {
                          router.push({ pathname: '/product/[slug]', params: { slug: item.slug } });
                        } else {
                          router.push('/shop');
                        }
                      }}>
                      <Text style={s.heroCtaText}>{item.cta} →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
            {/* Dots */}
            {heroItems.length > 1 && (
              <View style={s.dotsRow}>
                {heroItems.map((_, i) => (
                  <View key={i} style={[s.dot, i === slideIdx && s.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* 2. Category Circles Rail */}
        <View style={s.catRailSec}>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>ক্যাটাগরি</Text>
            <TouchableOpacity onPress={() => router.push('/categories')}>
              <Text style={s.seeAll}>সবগুলো দেখুন ➔</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catRailScroll}>
            {/* All Category Pill */}
            <TouchableOpacity
              style={s.catCircleCard}
              onPress={() => router.push('/shop')}
              activeOpacity={0.8}>
              <View style={s.catRing}>
                <View style={[s.catInner, { backgroundColor: C.forest }]}>
                  <Ionicons name="grid" size={24} color={C.gold} />
                </View>
              </View>
              <Text style={s.catCardTitle} numberOfLines={1}>
                সব ক্যাটাগরি
              </Text>
              <Text style={s.catCardCount}>{toBn(totalProductCount)}টি পণ্য</Text>
            </TouchableOpacity>

            {/* Individual categories */}
            {categories.map((c) => (
              <TouchableOpacity
                key={c.slug}
                style={s.catCircleCard}
                onPress={() => router.push({ pathname: '/shop', params: { category: c.slug } })}
                activeOpacity={0.8}>
                <View style={s.catRing}>
                  <View style={s.catInner}>
                    {c.image ? (
                      <Image source={{ uri: c.image }} style={s.catImg} contentFit="cover" />
                    ) : (
                      <Text style={s.catGlyph}>{c.name.slice(0, 1)}</Text>
                    )}
                  </View>
                </View>
                <Text style={s.catCardTitle} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={s.catCardCount}>{toBn(c.count)}টি পণ্য</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 3. Discount Offers Horizontal Carousel (if any) */}
        {discounted.length > 0 && (
          <View style={s.sec}>
            <View style={s.secHeader}>
              <View>
                <Text style={s.secKicker}>সীমিত সময়ের ছাড়</Text>
                <Text style={s.secTitle}>বিশেষ অফার ও ডিল</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/offers')}>
                <Text style={s.seeAll}>সব অফার ➔</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.dealsScroll}>
              {discounted.slice(0, 6).map((item) => (
                <View key={item.id} style={{ width: 170, marginRight: 12 }}>
                  <ProductCard product={item} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Featured Products Grid */}
        <View style={s.sec}>
          <View style={s.secHeader}>
            <View>
              <Text style={s.secKicker}>খাঁটি ও স্বাস্থ্যকর</Text>
              <Text style={s.secTitle}>আমাদের সেরা পণ্যসমূহ</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text style={s.seeAll}>সব পণ্য ➔</Text>
            </TouchableOpacity>
          </View>
          <View style={s.productGrid}>
            {products.slice(0, 8).map((item) => (
              <View key={item.id} style={{ width: '50%', padding: 5 }}>
                <ProductCard product={item} />
              </View>
            ))}
          </View>
        </View>

        {/* 5. Trust / Value Proposition Badges */}
        <View style={s.trustWrap}>
          <View style={s.trustItem}>
            <Text style={s.trustIcon}>🌿</Text>
            <Text style={s.trustTitle}>১০০% খাঁটি পণ্য</Text>
            <Text style={s.trustSub}>প্রাকৃতিক ও ভেজালমুক্ত</Text>
          </View>
          <View style={s.trustItem}>
            <Text style={s.trustIcon}>🚚</Text>
            <Text style={s.trustTitle}>দ্রুত ডেলিভারি</Text>
            <Text style={s.trustSub}>সারাদেশে হোম ডেলিভারি</Text>
          </View>
          <View style={s.trustItem}>
            <Text style={s.trustIcon}>💵</Text>
            <Text style={s.trustTitle}>ক্যাশ অন ডেলিভারি</Text>
            <Text style={s.trustSub}>পণ্য দেখে মূল্য পরিশোধ</Text>
          </View>
        </View>

        {/* 6. Customer Reviews */}
        <View style={s.sec}>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>গ্রাহকদের মন্তব্য</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.reviewScroll}>
            {(reviews.length ? reviews : FALLBACK_REVIEWS).map((r) => (
              <View key={r.id} style={s.reviewCard}>
                <View style={s.ratingRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Text
                      key={i}
                      style={[s.star, { color: i < r.rating ? '#eab308' : '#cbd5e1' }]}>
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={s.reviewComment}>"{r.comment}"</Text>
                <Text style={s.reviewAuthor}>— {r.customer_name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Floating Typewriter Contact Launcher */}
      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  heroWrap: {
    position: 'relative',
    height: 240,
  },
  heroSlide: {
    height: 240,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroGrad: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(23, 63, 53, 0.55)',
  },
  heroTextWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.ivory,
    lineHeight: 26,
  },
  heroSub: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 2,
    lineHeight: 16,
  },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: C.gold,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: R.pill,
    marginTop: 8,
  },
  heroCtaText: {
    color: C.forest,
    fontSize: 12,
    fontWeight: '900',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 18,
    backgroundColor: C.gold,
  },
  catRailSec: {
    marginTop: 14,
    paddingHorizontal: 14,
  },
  sec: {
    marginTop: 18,
    paddingHorizontal: 14,
  },
  secHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  secKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b83f4b',
  },
  secTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: C.forest,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '800',
    color: C.emerald,
  },
  catRailScroll: {
    paddingVertical: 4,
    gap: 12,
  },
  catCircleCard: {
    alignItems: 'center',
    width: 78,
  },
  catRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: C.line,
    padding: 2,
    marginBottom: 4,
    ...shadow,
  },
  catInner: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    overflow: 'hidden',
    backgroundColor: '#f7f1e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catImg: {
    width: '100%',
    height: '100%',
  },
  catGlyph: {
    fontSize: 22,
    fontWeight: '900',
    color: C.forest,
  },
  catCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.forest,
    textAlign: 'center',
  },
  catCardCount: {
    fontSize: 9,
    color: C.muted,
    marginTop: 1,
  },
  dealsScroll: {
    paddingVertical: 4,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  trustWrap: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    padding: 12,
    ...shadow,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  trustIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.forest,
    textAlign: 'center',
  },
  trustSub: {
    fontSize: 9,
    color: C.muted,
    textAlign: 'center',
    marginTop: 1,
  },
  reviewScroll: {
    paddingVertical: 4,
    gap: 12,
  },
  reviewCard: {
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  star: {
    fontSize: 13,
  },
  reviewComment: {
    fontSize: 12,
    color: C.ink,
    lineHeight: 17,
  },
  reviewAuthor: {
    fontSize: 11,
    fontWeight: '800',
    color: C.forest,
    marginTop: 8,
  },
});

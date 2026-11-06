import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Pressable,
} from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { C, R, shadow } from '@/constants/theme';
import {
  get,
  img,
  productImage,
  WHATSAPP,
  discountPercent,
  type HeroSlide,
  type Product,
  type Review,
} from '@/lib/api';

const FALLBACK_REVIEWS: Review[] = [
  { id: -1, customer_name: 'নুসরাত জাহান', rating: 5, comment: 'শেলফটির কোয়ালিটি অসাধারণ, ডেলিভারিও দ্রুত পেয়েছি।' },
  { id: -2, customer_name: 'রাকিবুল হাসান', rating: 5, comment: 'দাম অনুযায়ী পণ্যের মান খুবই ভালো, আবার অর্ডার করব।' },
  { id: -3, customer_name: 'ফারহানা আক্তার', rating: 5, comment: 'ঘরের চেহারাই বদলে গেছে, খুব সুন্দর ডিজাইন।' },
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
  const maxOff = discounted.length ? Math.max(...discounted.map(discountPercent)) : 0;

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
    const base = (products.filter((p) => p.is_featured).length ? products.filter((p) => p.is_featured) : products).slice(0, 5);
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
    }, 5000);
    return () => clearInterval(t);
  }, [heroItems.length]);

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; image?: string; count: number }>();
    for (const p of products) {
      if (!p.category?.slug) continue;
      const e = map.get(p.category.slug);
      if (e) {
        e.count += 1;
        e.image ||= productImage(p);
      } else {
        map.set(p.category.slug, { name: p.category.name, slug: p.category.slug, image: productImage(p), count: 1 });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const heroW = width - 32;
  const shown = reviews.length ? reviews : FALLBACK_REVIEWS;

  return (
    <ScrollView
      style={{ backgroundColor: C.ivory }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.forest} />}>
      {discounted.length > 0 && (
        <View style={s.announce}>
          <Text style={s.announceText}>
            {discounted.length}টি পণ্যে ছাড় — সর্বোচ্চ {maxOff}% পর্যন্ত!
          </Text>
        </View>
      )}

      {/* Hero */}
      {heroItems.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <FlatList
            ref={heroRef}
            data={heroItems}
            horizontal
            pagingEnabled={false}
            snapToInterval={heroW + 12}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            keyExtractor={(i) => i.key}
            getItemLayout={(_, index) => ({ length: heroW + 12, offset: (heroW + 12) * index, index })}
            onMomentumScrollEnd={(e) => setSlideIdx(Math.round(e.nativeEvent.contentOffset.x / (heroW + 12)))}
            renderItem={({ item }) => (
              <Pressable
                style={[s.hero, { width: heroW }]}
                onPress={() =>
                  item.slug
                    ? router.push({ pathname: '/product/[slug]', params: { slug: item.slug } })
                    : router.push('/shop')
                }>
                {item.image && <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" />}
                <View style={s.heroShade} />
                <View style={s.heroText}>
                  {!!item.eyebrow && <Text style={s.heroEyebrow}>{item.eyebrow}</Text>}
                  <Text style={s.heroTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={s.heroBtn}>
                    <Text style={s.heroBtnText}>{item.cta}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
          {heroItems.length > 1 && (
            <View style={s.dots}>
              {heroItems.map((h, i) => (
                <View key={h.key} style={[s.dot, i === slideIdx && s.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <View style={s.section}>
          <Text style={s.h2}>ক্যাটাগরি</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
            {categories.map((c) => (
              <Pressable
                key={c.slug}
                style={s.cat}
                onPress={() => router.push({ pathname: '/shop', params: { category: c.slug } })}>
                {c.image ? (
                  <Image source={{ uri: c.image }} style={s.catImg} contentFit="cover" />
                ) : (
                  <View style={[s.catImg, { backgroundColor: C.cream }]} />
                )}
                <Text style={s.catName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={s.catCount}>{c.count}টি পণ্য</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Products */}
      <View style={s.section}>
        <View style={s.grid}>
          {products.slice(0, 12).map((p) => (
            <View key={p.id} style={s.cell}>
              <ProductCard product={p} />
            </View>
          ))}
        </View>
        {products.length > 12 && (
          <Pressable style={s.more} onPress={() => router.push('/shop')}>
            <Text style={s.moreText}>সব পণ্য দেখুন</Text>
            <Ionicons name="arrow-forward" size={16} color={C.forest} />
          </Pressable>
        )}
      </View>

      {/* Reviews */}
      <View style={s.section}>
        <Text style={s.h2}>ক্রেতাদের মতামত</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
          {shown.map((r) => (
            <View key={r.id} style={s.review}>
              <View style={s.rHead}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{r.customer_name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <View>
                  <Text style={s.rName}>{r.customer_name}</Text>
                  <Text style={s.rVerified}>✓ ভেরিফাইড ক্রেতা</Text>
                </View>
              </View>
              <Text style={s.stars}>{'★'.repeat(r.rating)}</Text>
              <Text style={s.rText}>“{r.comment}”</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* WhatsApp CTA */}
      <View style={s.cta}>
        <View style={{ flex: 1 }}>
          <Text style={s.ctaTitle}>কোনো প্রশ্ন আছে?</Text>
          <Text style={s.ctaSub}>হোয়াটসঅ্যাপে সরাসরি আমাদের সাথে কথা বলুন</Text>
        </View>
        <Pressable style={s.ctaBtn} onPress={() => Linking.openURL(WHATSAPP)}>
          <Ionicons name="logo-whatsapp" size={18} color={C.forest} />
        </Pressable>
      </View>

      {/* Why us */}
      <View style={s.section}>
        <Text style={s.h2}>কেন আলোর ছোঁয়া?</Text>
        {[
          ['প্রিমিয়াম মান', 'প্রতিটি পণ্য যত্নসহকারে নির্বাচিত ও পরীক্ষিত।'],
          ['নিরাপদ অর্ডার', 'ক্যাশ অন ডেলিভারি ও নিরাপদ পেমেন্ট সুবিধা।'],
          ['নির্ভরযোগ্য ডেলিভারি', 'সারা বাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারি।'],
        ].map(([t, d]) => (
          <View key={t} style={s.why}>
            <Text style={s.whyT}>{t}</Text>
            <Text style={s.whyD}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={s.footer}>
        <Text style={s.footBrand}>আলোর ছোঁয়া মার্ট</Text>
        <Text style={s.footText}>আপনার ঘর, আপনার রুচির প্রতিচ্ছবি—বাংলাদেশের প্রিমিয়াম হোম ডেকর ব্র্যান্ড।</Text>
        <Text style={s.footText}>01302 111188</Text>
        <Text style={[s.footText, { opacity: 0.6, marginTop: 8 }]}>© 2026 আলোর ছোঁয়া মার্ট</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  announce: { backgroundColor: C.forest, paddingVertical: 8, alignItems: 'center' },
  announceText: { color: C.cream, fontSize: 12, fontWeight: '700' },
  hero: { height: 210, borderRadius: R.lg + 4, overflow: 'hidden', backgroundColor: C.forest, justifyContent: 'flex-end' },
  heroShade: { ...StyleSheet.absoluteFill as object, backgroundColor: 'rgba(23,63,53,0.45)' },
  heroText: { padding: 16, gap: 6 },
  heroEyebrow: { color: C.gold, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  heroTitle: { color: C.white, fontSize: 22, fontWeight: '800' },
  heroBtn: { alignSelf: 'flex-start', backgroundColor: C.cream, borderRadius: R.pill, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  heroBtnText: { color: C.forest, fontWeight: '800', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.line },
  dotActive: { width: 18, backgroundColor: C.forest },
  section: { paddingHorizontal: 16, marginTop: 24 },
  h2: { fontSize: 20, fontWeight: '800', color: C.forest, marginBottom: 12 },
  cat: { width: 104, alignItems: 'center' },
  catImg: { width: 104, height: 104, borderRadius: R.lg, backgroundColor: C.cream },
  catName: { marginTop: 6, fontWeight: '700', color: C.ink, fontSize: 13 },
  catCount: { fontSize: 11, color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
  more: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, marginTop: 14, paddingVertical: 10, paddingHorizontal: 20, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.forest },
  moreText: { color: C.forest, fontWeight: '800' },
  review: { width: 260, backgroundColor: C.white, borderRadius: R.lg, padding: 14, gap: 8, ...shadow },
  rHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.emerald, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.white, fontWeight: '800', fontSize: 16 },
  rName: { fontWeight: '700', color: C.ink },
  rVerified: { fontSize: 11, color: C.emerald },
  stars: { color: C.star, letterSpacing: 2 },
  rText: { color: '#374151', lineHeight: 20, fontSize: 13 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, marginTop: 24, padding: 18, borderRadius: R.lg, backgroundColor: C.forest },
  ctaTitle: { color: C.white, fontWeight: '800', fontSize: 17 },
  ctaSub: { color: C.cream, fontSize: 12, marginTop: 2 },
  ctaBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  why: { backgroundColor: C.cream, borderRadius: R.md, padding: 14, marginBottom: 10 },
  whyT: { fontWeight: '800', color: C.forest, fontSize: 15 },
  whyD: { color: C.muted, marginTop: 2, fontSize: 13 },
  footer: { backgroundColor: C.forest, padding: 20, marginTop: 24, gap: 4 },
  footBrand: { color: C.white, fontWeight: '800', fontSize: 18 },
  footText: { color: C.cream, fontSize: 12, lineHeight: 18 },
});

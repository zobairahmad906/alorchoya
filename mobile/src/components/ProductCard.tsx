import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { C, R, shadow } from '@/constants/theme';
import { effectivePrice, productImage, taka, type Product } from '@/lib/api';
import { useCart } from '@/lib/cart';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const uri = productImage(product);
  const curPrice = effectivePrice(product);
  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
  const isAvailable = product.stock === undefined || product.stock === null || Number(product.stock) > 0;
  const imageCount = product.images ? product.images.length : 0;
  const avgRating = product.average_rating ? Number(product.average_rating).toFixed(1) : '5.0';
  const totalReviews = product.total_reviews !== undefined ? product.total_reviews : 0;

  const handleCardPress = () => {
    router.push({ pathname: '/product/[slug]', params: { slug: product.slug } });
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;
    add(product, 1);
  };

  const handleOrderNow = () => {
    if (!isAvailable) return;
    add(product, 1);
    router.push('/checkout');
  };

  return (
    <Pressable style={s.card} onPress={handleCardPress}>
      {/* 1:1 Square Image Canvas */}
      <View style={s.imgWrap}>
        {uri ? (
          <Image source={{ uri }} style={s.img} contentFit="cover" transition={200} />
        ) : (
          <View style={[s.img, s.noImg]}>
            <Text style={s.noImgText}>আ</Text>
          </View>
        )}

        {/* Feature badge */}
        {product.is_featured && (
          <View style={s.featuredBadge}>
            <Text style={s.badgeText}>ফিচার্ড</Text>
          </View>
        )}

        {/* Gallery count badge */}
        {imageCount > 1 && (
          <View style={s.galleryBadge}>
            <Text style={s.galleryBadgeText}>📷 {imageCount}টি ছবি</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={s.body}>
        <Text style={s.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating Row */}
        <View style={s.ratingRow}>
          <Text style={s.starGold}>★</Text>
          <Text style={s.ratingNum}>{avgRating}</Text>
          <Text style={s.reviewCount}>({totalReviews})</Text>
        </View>

        {/* Price Row */}
        <View style={s.priceRow}>
          <Text style={s.nowPrice}>{taka(curPrice)}</Text>
          {hasDiscount && <Text style={s.oldPrice}>{taka(Number(product.price))}</Text>}
        </View>

        {/* Action Buttons: Add to Cart + Order Now */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.btnGhost, !isAvailable && s.btnDisabled]}
            disabled={!isAvailable}
            onPress={handleAddToCart}
            activeOpacity={0.75}>
            <Text style={[s.btnGhostText, !isAvailable && s.btnDisabledText]}>
              {isAvailable ? 'কার্টে যোগ' : 'স্টক শেষ'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnPrimary, !isAvailable && s.btnDisabled]}
            disabled={!isAvailable}
            onPress={handleOrderNow}
            activeOpacity={0.85}>
            <Text style={[s.btnPrimaryText, !isAvailable && s.btnDisabledText]}>
              {isAvailable ? 'অর্ডার করুন' : 'স্টক শেষ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
    marginBottom: 12,
  },
  imgWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f7f1e5',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  noImg: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1ebd9',
  },
  noImgText: {
    fontSize: 32,
    fontWeight: '900',
    color: C.forest,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.forest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '800',
  },
  galleryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(23, 63, 53, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  galleryBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  body: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    marginBottom: 6,
  },
  starGold: {
    color: '#eab308',
    fontSize: 13,
  },
  ratingNum: {
    fontSize: 11,
    fontWeight: '800',
    color: C.forest,
  },
  reviewCount: {
    fontSize: 10,
    color: C.muted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  nowPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: C.forest,
  },
  oldPrice: {
    fontSize: 11,
    color: C.muted,
    textDecorationLine: 'line-through',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  btnGhost: {
    flex: 1,
    height: 34,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.forest,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.forest,
  },
  btnPrimary: {
    flex: 1,
    height: 34,
    borderRadius: R.pill,
    backgroundColor: C.forest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.ivory,
  },
  btnDisabled: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  btnDisabledText: {
    color: '#94a3b8',
  },
});

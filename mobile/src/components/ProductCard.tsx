import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, R, shadow } from '@/constants/theme';
import { useCart } from '@/lib/cart';
import { discountPercent, effectivePrice, productImage, taka, type Product } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const uri = productImage(product);
  const off = discountPercent(product);
  const out = product.stock <= 0;

  return (
    <Pressable
      style={s.card}
      onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: product.slug } })}>
      <View style={s.imgWrap}>
        {uri ? (
          <Image source={{ uri }} style={s.img} contentFit="cover" transition={150} />
        ) : (
          <View style={[s.img, s.noImg]}>
            <Text style={s.noImgText}>আ</Text>
          </View>
        )}
        {off > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>-{off}%</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        <Text style={s.cat} numberOfLines={1}>
          {product.category?.name}
        </Text>
        <Text style={s.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={s.priceRow}>
          <Text style={s.price}>{taka(effectivePrice(product))}</Text>
          {off > 0 && <Text style={s.old}>{taka(Number(product.price))}</Text>}
        </View>

        <View style={s.actions}>
          <Pressable
            disabled={out}
            style={[s.btn, s.btnGhost, out && s.disabled]}
            onPress={() => add(product)}>
            <Ionicons name="cart-outline" size={15} color={C.forest} />
            <Text style={s.btnGhostText}>কার্ট</Text>
          </Pressable>
          <Pressable
            disabled={out}
            style={[s.btn, s.btnSolid, out && s.disabled]}
            onPress={() => {
              add(product);
              router.push('/checkout');
            }}>
            <Text style={s.btnSolidText}>{out ? 'স্টক নেই' : 'অর্ডার'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, backgroundColor: C.white, borderRadius: R.lg, overflow: 'hidden', ...shadow },
  imgWrap: { aspectRatio: 1, backgroundColor: C.cream },
  img: { width: '100%', height: '100%' },
  noImg: { alignItems: 'center', justifyContent: 'center' },
  noImgText: { fontSize: 40, color: C.sage },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.caramel,
    borderRadius: R.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: C.white, fontSize: 11, fontWeight: '800' },
  body: { padding: 10, gap: 4 },
  cat: { fontSize: 11, color: C.muted },
  name: { fontSize: 14, fontWeight: '700', color: C.ink, minHeight: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  price: { fontSize: 16, fontWeight: '800', color: C.forest },
  old: { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 6 },
  btn: {
    flex: 1,
    height: 36,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  btnGhost: { borderWidth: 1.5, borderColor: C.forest },
  btnGhostText: { color: C.forest, fontWeight: '700', fontSize: 12 },
  btnSolid: { backgroundColor: C.forest },
  btnSolidText: { color: C.white, fontWeight: '700', fontSize: 12 },
  disabled: { opacity: 0.45 },
});


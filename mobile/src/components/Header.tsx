import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R, shadow } from '@/constants/theme';
import { API, img, taka, type Product } from '@/lib/api';
import { useCart } from '@/lib/cart';

export function MobileHeader({ title }: { title?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { count } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const res = await fetch(`${API}/products/?search=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const items: Product[] = Array.isArray(data) ? data : data.results || [];
          setSearchResults(items.slice(0, 5));
        }
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectProduct = (slug: string) => {
    setSearchOpen(false);
    setQuery('');
    setSearchResults([]);
    router.push({ pathname: '/product/[slug]', params: { slug } });
  };

  const handleFullSearch = () => {
    if (!query.trim()) return;
    const q = query.trim();
    setSearchOpen(false);
    setQuery('');
    setSearchResults([]);
    router.push({ pathname: '/shop', params: { search: q } });
  };

  return (
    <View style={[s.headerWrap, { paddingTop: insets.top + 6 }]}>
      <View style={s.headerInner}>
        {/* Brand Logo & Name */}
        <Pressable style={s.brand} onPress={() => router.push('/')}>
          <Image
            source={require('../../assets/images/logo.jpeg')}
            style={s.brandLogo}
            resizeMode="cover"
          />
          <View>
            <Text style={s.brandTitle}>আলোর ছোঁয়া মার্ট</Text>
            <Text style={s.brandSub}>Alor Chhoya Mart</Text>
          </View>
        </Pressable>

        {/* Right actions: Search icon, Language pill, Cart badge */}
        <View style={s.navRight}>
          {/* Search Trigger */}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => setSearchOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="search" size={20} color={C.forest} />
          </TouchableOpacity>

          {/* Language Switcher Pill */}
          <View style={s.langPill}>
            <TouchableOpacity
              style={[s.langBtn, lang === 'bn' && s.langBtnActive]}
              onPress={() => setLang('bn')}>
              <Text style={[s.langText, lang === 'bn' && s.langTextActive]}>বাংলা</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.langBtn, lang === 'en' && s.langBtnActive]}
              onPress={() => setLang('en')}>
              <Text style={[s.langText, lang === 'en' && s.langTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>

          {/* Cart Icon with Red Badge */}
          <TouchableOpacity
            style={s.cartBtn}
            onPress={() => router.push('/cart')}
            activeOpacity={0.7}>
            <Ionicons name="bag-handle-outline" size={22} color={C.forest} />
            {count > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{count > 99 ? '99+' : count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Instant Search Suggestions Modal */}
      <Modal visible={searchOpen} animationType="fade" transparent onRequestClose={() => setSearchOpen(false)}>
        <View style={s.searchBackdrop}>
          <View style={[s.searchBox, { marginTop: insets.top + 10 }]}>
            {/* Input Bar */}
            <View style={s.searchInputRow}>
              <Ionicons name="search" size={20} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={s.searchInput}
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="পণ্য খুঁজুন (যেমন: মধু, ঘি, তেল)..."
                placeholderTextColor={C.muted}
                returnKeyType="search"
                onSubmitEditing={handleFullSearch}
              />
              <TouchableOpacity
                onPress={() => {
                  setSearchOpen(false);
                  setQuery('');
                  setSearchResults([]);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Results Dropdown */}
            {query.trim().length > 0 && (
              <View style={s.searchResultsPanel}>
                {loadingSearch ? (
                  <Text style={s.searchEmptyText}>খোঁজা হচ্ছে...</Text>
                ) : searchResults.length > 0 ? (
                  <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
                    <Text style={s.searchResultsHeader}>
                      তাৎক্ষণিক অনুসন্ধানের ফলাফল ({searchResults.length})
                    </Text>
                    {searchResults.map((prod) => {
                      const imageUri = img(
                        prod.images.find((x) => x.is_primary)?.card_image ||
                          prod.images.find((x) => x.is_primary)?.hero_desktop ||
                          prod.images[0]?.image,
                      );
                      const price = Number(prod.discount_price || prod.price);
                      return (
                        <TouchableOpacity
                          key={prod.id}
                          style={s.searchItem}
                          onPress={() => handleSelectProduct(prod.slug)}>
                          {imageUri ? (
                            <Image source={{ uri: imageUri }} style={s.searchItemThumb} />
                          ) : (
                            <View style={[s.searchItemThumb, s.searchThumbFallback]}>
                              <Text style={{ fontSize: 16 }}>📦</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={s.searchItemTitle} numberOfLines={1}>
                              {prod.name}
                            </Text>
                            <Text style={s.searchItemPrice}>{taka(price)}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={C.muted} />
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity style={s.allResultsBtn} onPress={handleFullSearch}>
                      <Text style={s.allResultsBtnText}>সব ফলাফল দেখুন ({query}) ➔</Text>
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <Text style={s.searchEmptyText}>মাফ করবেন, কোনো পণ্য পাওয়া যায়নি!</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  headerWrap: {
    backgroundColor: C.ivory,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingHorizontal: 14,
    paddingBottom: 10,
    zIndex: 50,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.gold,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.forest,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '600',
    color: C.caramel,
    marginTop: -2,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ece6d8',
    borderRadius: R.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: C.line,
  },
  langBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
  langBtnActive: {
    backgroundColor: C.forest,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.forest,
  },
  langTextActive: {
    color: C.ivory,
  },
  cartBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#c95b4b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  searchBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 63, 53, 0.45)',
    paddingHorizontal: 14,
  },
  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
    ...shadow,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
    paddingVertical: 4,
  },
  searchResultsPanel: {
    backgroundColor: '#fff',
  },
  searchResultsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  searchItemThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  searchThumbFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  searchItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  allResultsBtn: {
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  allResultsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284c7',
  },
  searchEmptyText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 13,
    color: C.muted,
  },
});


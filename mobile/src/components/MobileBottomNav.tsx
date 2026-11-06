import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, shadow } from '@/constants/theme';
import { WHATSAPP } from '@/lib/api';
import { useCart } from '@/lib/cart';

export function MobileBottomNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const [moreOpen, setMoreOpen] = useState(false);

  const isHome = pathname === '/' || pathname === '/index';
  const isShop = pathname.startsWith('/shop');
  const isCart = pathname.startsWith('/cart');
  const isAccount = pathname.startsWith('/account');

  const navigateTo = (path: any) => {
    setMoreOpen(false);
    router.push(path);
  };

  const openWhatsApp = () => {
    setMoreOpen(false);
    Linking.openURL(WHATSAPP).catch(() => undefined);
  };

  return (
    <>
      {/* ⋯ আরও Popover Bottom Sheet */}
      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setMoreOpen(false)}>
          <View style={[s.morePopover, { bottom: 76 + insets.bottom }]}>
            <TouchableOpacity
              style={s.moreItem}
              onPress={() => navigateTo('/offers')}
              activeOpacity={0.7}>
              <Text style={s.moreItemIcon}>🏷️</Text>
              <Text style={s.moreItemText}>অফার</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.moreItem}
              onPress={() => navigateTo('/categories')}
              activeOpacity={0.7}>
              <Text style={s.moreItemIcon}>▦</Text>
              <Text style={s.moreItemText}>ক্যাটাগরি</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.moreItem}
              onPress={() => navigateTo('/track-order')}
              activeOpacity={0.7}>
              <Text style={s.moreItemIcon}>⌁</Text>
              <Text style={s.moreItemText}>অর্ডার ট্র্যাক</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.moreItem, { borderBottomWidth: 0 }]}
              onPress={openWhatsApp}
              activeOpacity={0.7}>
              <Text style={s.moreItemIcon}>✉</Text>
              <Text style={s.moreItemText}>যোগাযোগ</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Main 5-Item Bottom Bar */}
      <View style={[s.navContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        {/* 1. শপ */}
        <TouchableOpacity
          style={s.tabItem}
          onPress={() => navigateTo('/shop')}
          activeOpacity={0.7}>
          <Ionicons
            name={isShop ? 'grid' : 'grid-outline'}
            size={22}
            color={isShop ? C.forest : C.coffee}
          />
          <Text style={[s.tabLabel, isShop && s.tabLabelActive]}>শপ</Text>
        </TouchableOpacity>

        {/* 2. কার্ট */}
        <TouchableOpacity
          style={s.tabItem}
          onPress={() => navigateTo('/cart')}
          activeOpacity={0.7}>
          <View style={s.iconWrap}>
            <Ionicons
              name={isCart ? 'bag-handle' : 'bag-handle-outline'}
              size={22}
              color={isCart ? C.forest : C.coffee}
            />
            {count > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{count > 99 ? '99+' : count}</Text>
              </View>
            )}
          </View>
          <Text style={[s.tabLabel, isCart && s.tabLabelActive]}>কার্ট</Text>
        </TouchableOpacity>

        {/* 3. হোম (Elevated Center Circle) */}
        <TouchableOpacity
          style={s.homeItem}
          onPress={() => navigateTo('/')}
          activeOpacity={0.85}>
          <View style={[s.homeCircle, isHome && s.homeCircleActive]}>
            <Text style={s.homeIcon}>⌂</Text>
          </View>
          <Text style={[s.tabLabel, s.homeLabel]}>হোম</Text>
        </TouchableOpacity>

        {/* 4. অ্যাকাউন্ট */}
        <TouchableOpacity
          style={s.tabItem}
          onPress={() => navigateTo('/account')}
          activeOpacity={0.7}>
          <Ionicons
            name={isAccount ? 'person' : 'person-outline'}
            size={22}
            color={isAccount ? C.forest : C.coffee}
          />
          <Text style={[s.tabLabel, isAccount && s.tabLabelActive]}>অ্যাকাউন্ট</Text>
        </TouchableOpacity>

        {/* 5. আরও (3 dots popover trigger) */}
        <TouchableOpacity
          style={s.tabItem}
          onPress={() => setMoreOpen(!moreOpen)}
          activeOpacity={0.7}>
          <Text style={[s.moreDots, moreOpen && { color: C.forest }]}>⋯</Text>
          <Text style={[s.tabLabel, moreOpen && s.tabLabelActive]}>আরও</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.ivory,
    borderTopWidth: 1,
    borderTopColor: C.line,
    height: 68,
    paddingTop: 6,
    zIndex: 70,
    ...shadow,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#c95b4b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.coffee,
    marginTop: 2,
  },
  tabLabelActive: {
    color: C.forest,
    fontWeight: '800',
  },
  homeItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -20,
  },
  homeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.forest,
    borderWidth: 4,
    borderColor: C.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  homeCircleActive: {
    backgroundColor: '#0f2c25',
  },
  homeIcon: {
    fontSize: 26,
    color: C.gold,
    fontWeight: '900',
    lineHeight: 28,
  },
  homeLabel: {
    color: C.forest,
    fontWeight: '800',
    marginTop: 2,
  },
  moreDots: {
    fontSize: 24,
    lineHeight: 22,
    color: C.coffee,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 63, 53, 0.25)',
  },
  morePopover: {
    position: 'absolute',
    right: 14,
    minWidth: 180,
    backgroundColor: 'rgba(255, 253, 248, 0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    padding: 6,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3ece0',
  },
  moreItemIcon: {
    fontSize: 18,
  },
  moreItemText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.forest,
  },
});

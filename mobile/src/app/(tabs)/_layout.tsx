import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { C } from '@/constants/theme';
import { useCart } from '@/lib/cart';

export default function TabsLayout() {
  const { count } = useCart();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.ivory },
        headerTintColor: C.forest,
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: C.forest,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.ivory, borderTopColor: C.line, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'হোম',
          headerTitle: 'আলোর ছোঁয়া মার্ট',
          headerRight: () => (
            <Pressable onPress={() => router.push('/shop')} hitSlop={10} style={{ marginRight: 16 }}>
              <Ionicons name="search" size={26} color={C.forest} />
            </Pressable>
          ),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'শপ',
          headerTitle: 'সব পণ্য',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'কার্ট',
          headerTitle: 'আপনার কার্ট',
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: C.caramel },
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle-outline" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}

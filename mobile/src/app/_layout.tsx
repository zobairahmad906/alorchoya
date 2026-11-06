import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { C } from '@/constants/theme';
import { CartProvider } from '@/lib/cart';

export default function RootLayout() {
  return (
    <CartProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.ivory },
          headerTintColor: C.forest,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: C.ivory },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ title: 'পণ্যের বিবরণ' }} />
        <Stack.Screen name="checkout" options={{ title: 'চেকআউট' }} />
      </Stack>
    </CartProvider>
  );
}

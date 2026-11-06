import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';
import { CartProvider } from '@/lib/cart';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
          <Stack.Screen name="offers" options={{ headerShown: false }} />
          <Stack.Screen name="categories" options={{ headerShown: false }} />
          <Stack.Screen name="track-order" options={{ headerShown: false }} />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
}

import { Tabs } from 'expo-router';
import React from 'react';

import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <MobileBottomNav />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'হোম' }} />
      <Tabs.Screen name="shop" options={{ title: 'শপ' }} />
      <Tabs.Screen name="cart" options={{ title: 'কার্ট' }} />
      <Tabs.Screen name="account" options={{ title: 'অ্যাকাউন্ট' }} />
    </Tabs>
  );
}

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R, shadow } from '@/constants/theme';

export type FilterValues = {
  category: string;
  sort: 'popular' | 'low' | 'high' | 'discount';
  minPrice: string;
  maxPrice: string;
  discountOnly: boolean;
  stockOnly: boolean;
};

type Props = {
  categories: { slug: string; name: string }[];
  filters: FilterValues;
  onApply: (nextFilters: FilterValues) => void;
  onReset: () => void;
};

export function CatalogToolsModal({ categories, filters, onApply, onReset }: Props) {
  const insets = useSafeAreaInsets();
  const [modalOpen, setModalOpen] = useState(false);

  // Local draft states
  const [selectedCat, setSelectedCat] = useState(filters.category);
  const [selectedSort, setSelectedSort] = useState(filters.sort);
  const [minP, setMinP] = useState(filters.minPrice);
  const [maxP, setMaxP] = useState(filters.maxPrice);
  const [discOnly, setDiscOnly] = useState(filters.discountOnly);
  const [stkOnly, setStkOnly] = useState(filters.stockOnly);

  const activeCount = [
    filters.category !== 'all' ? filters.category : '',
    filters.sort !== 'popular' ? filters.sort : '',
    filters.minPrice,
    filters.maxPrice,
    filters.discountOnly ? 'disc' : '',
    filters.stockOnly ? 'stock' : '',
  ].filter(Boolean).length;

  const handleOpen = () => {
    setSelectedCat(filters.category);
    setSelectedSort(filters.sort);
    setMinP(filters.minPrice);
    setMaxP(filters.maxPrice);
    setDiscOnly(filters.discountOnly);
    setStkOnly(filters.stockOnly);
    setModalOpen(true);
  };

  const handleApply = () => {
    onApply({
      category: selectedCat,
      sort: selectedSort,
      minPrice: minP,
      maxPrice: maxP,
      discountOnly: discOnly,
      stockOnly: stkOnly,
    });
    setModalOpen(false);
  };

  const handleReset = () => {
    setSelectedCat('all');
    setSelectedSort('popular');
    setMinP('');
    setMaxP('');
    setDiscOnly(false);
    setStkOnly(false);
    onReset();
    setModalOpen(false);
  };

  return (
    <>
      {/* Floating Filter FAB */}
      <TouchableOpacity
        style={[s.fab, { bottom: 82 + insets.bottom }]}
        onPress={handleOpen}
        activeOpacity={0.85}>
        <Ionicons name="options-outline" size={22} color={C.ivory} />
        {activeCount > 0 && (
          <View style={s.fabBadge}>
            <Text style={s.fabBadgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={s.modalBackdrop}>
          <Pressable style={s.backdropDismiss} onPress={() => setModalOpen(false)} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
            {/* Sheet Header */}
            <View style={s.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="filter" size={20} color={C.forest} />
                <Text style={s.sheetTitle}>ফিল্টার ও সাজানো</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={C.forest} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.sheetBody} showsVerticalScrollIndicator={false}>
              {/* Category */}
              <Text style={s.secTitle}>ক্যাটাগরি</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
                <TouchableOpacity
                  style={[s.pill, selectedCat === 'all' && s.pillActive]}
                  onPress={() => setSelectedCat('all')}>
                  <Text style={[s.pillText, selectedCat === 'all' && s.pillTextActive]}>সব পণ্য</Text>
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.slug}
                    style={[s.pill, selectedCat === c.slug && s.pillActive]}
                    onPress={() => setSelectedCat(c.slug)}>
                    <Text style={[s.pillText, selectedCat === c.slug && s.pillTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Sort By */}
              <Text style={s.secTitle}>সাজানোর ক্রম</Text>
              <View style={s.sortGrid}>
                {[
                  { id: 'popular', label: 'জনপ্রিয়' },
                  { id: 'low', label: 'কম দাম আগে' },
                  { id: 'high', label: 'বেশি দাম আগে' },
                  { id: 'discount', label: 'বেশি ছাড় আগে' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.sortOption, selectedSort === item.id && s.sortOptionActive]}
                    onPress={() => setSelectedSort(item.id as any)}>
                    <Text style={[s.sortText, selectedSort === item.id && s.sortTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <Text style={s.secTitle}>মূল্য সীমা (৳)</Text>
              <View style={s.priceRow}>
                <TextInput
                  style={s.priceInput}
                  placeholder="সর্বনিম্ন"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  value={minP}
                  onChangeText={setMinP}
                />
                <Text style={s.priceSep}>—</Text>
                <TextInput
                  style={s.priceInput}
                  placeholder="সর্বোচ্চ"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  value={maxP}
                  onChangeText={setMaxP}
                />
              </View>

              {/* Toggles */}
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>শুধু ছাড়ের পণ্য (Discount Only)</Text>
                <Switch
                  value={discOnly}
                  onValueChange={setDiscOnly}
                  trackColor={{ false: '#e2e8f0', true: C.emerald }}
                  thumbColor="#fff"
                />
              </View>

              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>স্টকে আছে এমন পণ্য (In Stock Only)</Text>
                <Switch
                  value={stkOnly}
                  onValueChange={setStkOnly}
                  trackColor={{ false: '#e2e8f0', true: C.emerald }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={s.sheetFooter}>
              <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
                <Text style={s.resetBtnText}>রিসেট</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.applyBtn} onPress={handleApply}>
                <Text style={s.applyBtnText}>ফিল্টার প্রয়োগ করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 14,
    zIndex: 75,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.forest,
    borderWidth: 2,
    borderColor: C.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.gold,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fabBadgeText: {
    color: C.forest,
    fontSize: 10,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 63, 53, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: C.ivory,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.forest,
  },
  sheetBody: {
    paddingVertical: 12,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.forest,
    marginTop: 10,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: '#ece6d8',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: C.forest,
    borderColor: C.gold,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.forest,
  },
  pillTextActive: {
    color: C.ivory,
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
  },
  sortOptionActive: {
    backgroundColor: '#e7f0ec',
    borderColor: C.emerald,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  sortTextActive: {
    color: C.emerald,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 12,
    fontSize: 14,
    color: C.ink,
  },
  priceSep: {
    color: C.muted,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1ebd9',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  resetBtn: {
    flex: 1,
    height: 46,
    borderRadius: R.pill,
    backgroundColor: '#ece6d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.coffee,
  },
  applyBtn: {
    flex: 2,
    height: 46,
    borderRadius: R.pill,
    backgroundColor: C.forest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.ivory,
  },
});

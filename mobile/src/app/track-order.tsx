import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ContactLauncher } from '@/components/ContactLauncher';
import { MobileHeader } from '@/components/Header';
import { C, R, shadow } from '@/constants/theme';
import { API, taka, WHATSAPP } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  processing: 'প্রস্তুত হচ্ছে',
  paid: 'পেমেন্ট সম্পন্ন',
  shipped: 'শিপ করা হয়েছে',
  delivered: 'ডেলিভারি সম্পন্ন',
  cancelled: 'বাতিল',
};

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

type TrackedOrder = {
  id: number;
  status: string;
  status_display?: string;
  payment_method?: string;
  total: string | number;
  created_at: string;
  address?: string;
  items?: {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string | number;
  }[];
};

export default function TrackOrderScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async () => {
    if (!phone.trim() && !orderId.trim()) {
      setErrorMsg('মোবাইল নম্বর অথবা অর্ডার নম্বর লিখুন।');
      return;
    }
    setErrorMsg('');
    setOrders([]);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (phone.trim()) params.append('phone', phone.trim());
      if (orderId.trim()) params.append('id', orderId.trim());

      const res = await fetch(`${API}/orders/track/?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'কোনো অর্ডার পাওয়া যায়নি। তথ্য সঠিক কিনা যাচাই করুন।');
      }

      // Check if data has multiple orders or single order
      const list: TrackedOrder[] = Array.isArray(data)
        ? data
        : Array.isArray(data.orders) && data.orders.length > 0
        ? data.orders
        : [data];

      setOrders(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'অর্ডার ট্র্যাক করতে সমস্যা হচ্ছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.ivory }}>
      <MobileHeader />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={s.heroCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={C.forest} />
            </TouchableOpacity>
            <Text style={s.kicker}>লাইভ অর্ডার ট্র্যাকিং</Text>
          </View>
          <Text style={s.title}>আপনার অর্ডার কোথায় আছে?</Text>
          <Text style={s.sub}>
            আপনার মোবাইল নম্বর দিয়ে অর্ডারের সব আপডেট ও টাইমলাইন সরাসরি দেখুন।
          </Text>
        </View>

        {/* Input Form Card */}
        <View style={s.formCard}>
          <View style={s.formHeader}>
            <View>
              <Text style={s.formBadge}>সহজ ও দ্রুত</Text>
              <Text style={s.formTitle}>ট্র্যাক করার তথ্য দিন</Text>
            </View>
            <Text style={{ fontSize: 24 }}>📦</Text>
          </View>

          <View style={s.field}>
            <Text style={s.label}>অর্ডারের মোবাইল নম্বর *</Text>
            <TextInput
              style={s.input}
              placeholder="01XXXXXXXXX"
              placeholderTextColor={C.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>অর্ডার নম্বর / ইনভয়েস আইডি (ঐচ্ছিক)</Text>
            <TextInput
              style={s.input}
              placeholder="যেমন: ১২৩ (নির্দিষ্ট অর্ডারের জন্য)"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={orderId}
              onChangeText={setOrderId}
            />
          </View>

          {errorMsg ? <Text style={s.error}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={s.submitBtn}
            onPress={handleTrack}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={C.ivory} />
            ) : (
              <Text style={s.submitBtnText}>অর্ডার ট্র্যাক করুন →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Orders Results with Timeline */}
        {orders.length > 0 && (
          <View style={{ gap: 14 }}>
            <View style={s.resultsHeaderRow}>
              <Text style={s.resultsHeaderTitle}>
                মোট অর্ডার পাওয়া গেছে: {orders.length}টি
              </Text>
            </View>

            {orders.map((ord) => {
              const currentStep = STEPS.indexOf(ord.status);
              const isCancelled = ord.status === 'cancelled';

              return (
                <View key={ord.id} style={s.resultCard}>
                  {/* Order Head */}
                  <View style={s.resultHead}>
                    <View>
                      <Text style={s.resultId}>অর্ডার #{ord.id}</Text>
                      <Text style={s.dateText}>
                        {new Date(ord.created_at).toLocaleDateString('bn-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View
                        style={[
                          s.statusPill,
                          isCancelled && { backgroundColor: '#fee2e2' },
                        ]}>
                        <Text
                          style={[
                            s.statusPillText,
                            isCancelled && { color: '#b3261e' },
                          ]}>
                          {STATUS_LABELS[ord.status] || ord.status}
                        </Text>
                      </View>
                      <Text style={s.resultTotal}>{taka(Number(ord.total))}</Text>
                    </View>
                  </View>

                  {/* 5-Step Progress Timeline */}
                  <View style={s.timelineContainer}>
                    <Text style={s.timelineHeading}>অর্ডার টাইমলাইন ও অগ্রগতি:</Text>
                    <View style={s.timeline}>
                      {STEPS.map((step, idx) => {
                        const isDone = idx <= currentStep && !isCancelled;
                        const isCurrent = idx === currentStep && !isCancelled;
                        const isPending = idx > currentStep && !isCancelled;

                        return (
                          <View key={step} style={s.timelineStepRow}>
                            {/* Circle Indicator & Connecting Line */}
                            <View style={s.indicatorCol}>
                              <View
                                style={[
                                  s.stepCircle,
                                  isDone && s.stepCircleDone,
                                  isCurrent && s.stepCircleCurrent,
                                  isCancelled && s.stepCircleCancelled,
                                ]}>
                                {isDone ? (
                                  <Ionicons name="checkmark" size={14} color={C.gold} />
                                ) : (
                                  <Text style={s.stepNum}>{idx + 1}</Text>
                                )}
                              </View>
                              {idx < STEPS.length - 1 && (
                                <View
                                  style={[
                                    s.connectingLine,
                                    idx < currentStep && !isCancelled && s.connectingLineDone,
                                  ]}
                                />
                              )}
                            </View>

                            {/* Step Description */}
                            <View style={s.stepContent}>
                              <View style={s.stepTitleRow}>
                                <Text
                                  style={[
                                    s.stepLabel,
                                    isDone && s.stepLabelDone,
                                    isCurrent && s.stepLabelCurrent,
                                  ]}>
                                  {STATUS_LABELS[step]}
                                </Text>
                                {isCurrent && (
                                  <View style={s.currentBadge}>
                                    <Text style={s.currentBadgeText}>বর্তমান অবস্থা</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={s.stepDesc}>
                                {step === 'pending'
                                  ? 'অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।'
                                  : step === 'confirmed'
                                  ? 'ফোন কলের মাধ্যমে অর্ডার নিশ্চিত করা হয়েছে।'
                                  : step === 'processing'
                                  ? 'পণ্যটি প্যাকেজিং ও প্রস্তুত করা হচ্ছে।'
                                  : step === 'shipped'
                                  ? 'কুরিয়ার সার্ভিসে হস্তান্তর করা হয়েছে।'
                                  : 'গ্রাহকের নিকট সফলভাবে ডেলিভারি সম্পন্ন।'}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Items List */}
                  {ord.items && ord.items.length > 0 && (
                    <View style={s.itemsSection}>
                      <Text style={s.itemsSecTitle}>অর্ডারকৃত পণ্যসমূহ:</Text>
                      {ord.items.map((it) => (
                        <View key={it.id} style={s.itemRow}>
                          <Text style={s.itemName} numberOfLines={1}>
                            • {it.product_name}
                          </Text>
                          <Text style={s.itemQtyPrice}>
                            {it.quantity}টি — {taka(Number(it.unit_price) * it.quantity)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Address info */}
                  {ord.address ? (
                    <View style={s.addressRow}>
                      <Ionicons name="location-outline" size={16} color={C.muted} />
                      <Text style={s.addressText} numberOfLines={2}>
                        ডেলিভারি ঠিকানা: {ord.address}
                      </Text>
                    </View>
                  ) : null}

                  {/* WhatsApp Support Button */}
                  <TouchableOpacity
                    style={s.orderWaBtn}
                    onPress={() => Linking.openURL(WHATSAPP)}
                    activeOpacity={0.8}>
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={s.orderWaBtnText}>এই অর্ডার সম্পর্কে হোয়াটসঅ্যাপে কথা বলুন</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Support Help */}
        <View style={s.helpCard}>
          <Text style={s.helpText}>
            অর্ডার নিয়ে যেকোনো তথ্যের জন্য আমাদের সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করুন।
          </Text>
          <TouchableOpacity
            style={s.waLink}
            onPress={() => Linking.openURL(WHATSAPP)}
            activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={s.waLinkText}>হোয়াটসঅ্যাপ হেল্পলাইন: 01302 111188</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ContactLauncher />
    </View>
  );
}

const s = StyleSheet.create({
  content: {
    padding: 14,
    paddingBottom: 90,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b83f4b',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: C.forest,
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
    marginBottom: 14,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  formBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: C.emerald,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.forest,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: C.forest,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fbf9f4',
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 12,
    fontSize: 14,
    color: C.ink,
  },
  error: {
    color: '#b3261e',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  submitBtn: {
    height: 46,
    borderRadius: R.pill,
    backgroundColor: C.forest,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: C.ivory,
    fontSize: 14,
    fontWeight: '900',
  },
  resultsHeaderRow: {
    paddingVertical: 4,
  },
  resultsHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: C.forest,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
  },
  resultHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultId: {
    fontSize: 16,
    fontWeight: '900',
    color: C.forest,
  },
  dateText: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: R.pill,
    backgroundColor: '#e7f0ec',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.forest,
  },
  resultTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: C.forest,
    marginTop: 4,
  },
  timelineContainer: {
    marginTop: 14,
    backgroundColor: '#fcfbfa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1ebd9',
  },
  timelineHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: C.forest,
    marginBottom: 12,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 26,
    marginRight: 10,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: C.forest,
  },
  stepCircleCurrent: {
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  stepCircleCancelled: {
    backgroundColor: '#b3261e',
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '800',
    color: C.muted,
  },
  connectingLine: {
    width: 2,
    height: 34,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  connectingLineDone: {
    backgroundColor: C.forest,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
  },
  stepLabelDone: {
    color: C.forest,
    fontWeight: '900',
  },
  stepLabelCurrent: {
    color: '#059669',
    fontWeight: '900',
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#d1fae5',
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065f46',
  },
  stepDesc: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  itemsSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 4,
  },
  itemsSecTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 12,
    color: C.ink,
    flex: 1,
    marginRight: 8,
  },
  itemQtyPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: C.forest,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 11,
    color: C.muted,
    flex: 1,
  },
  orderWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  orderWaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  helpCard: {
    backgroundColor: 'rgba(23, 63, 53, 0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  helpText: {
    fontSize: 12,
    color: C.coffee,
    textAlign: 'center',
    lineHeight: 18,
  },
  waLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  waLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.forest,
  },
});

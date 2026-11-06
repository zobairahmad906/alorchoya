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

export default function TrackOrderScreen() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id: number;
    status: string;
    total: string;
    created_at: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async () => {
    if (!orderId.trim() || !phone.trim()) {
      setErrorMsg('অর্ডার নম্বর এবং ফোন নম্বর দুটিই লিখুন।');
      return;
    }
    setErrorMsg('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${API}/orders/track/?id=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(phone.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'অর্ডার পাওয়া যায়নি। তথ্য সঠিক কিনা পরীক্ষা করুন।');
      }
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'অর্ডার ট্র্যাক করতে সমস্যা হচ্ছে।');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = result ? STEPS.indexOf(result.status) : -1;

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
            <Text style={s.kicker}>অর্ডার ট্র্যাকিং</Text>
          </View>
          <Text style={s.title}>আপনার অর্ডার কোথায় আছে?</Text>
          <Text style={s.sub}>
            অর্ডার নম্বর ও ফোন নম্বর দিয়ে আপনার অর্ডারের বর্তমান অবস্থা সরাসরি জানুন।
          </Text>
        </View>

        {/* Input Form Card */}
        <View style={s.formCard}>
          <View style={s.formHeader}>
            <View>
              <Text style={s.formBadge}>সহজ ও নিরাপদ</Text>
              <Text style={s.formTitle}>অর্ডারের তথ্য দিন</Text>
            </View>
            <Text style={{ fontSize: 24 }}>🔒</Text>
          </View>

          <View style={s.field}>
            <Text style={s.label}>অর্ডার নম্বর (Invoice / Order ID)</Text>
            <TextInput
              style={s.input}
              placeholder="যেমন: ১২৩"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={orderId}
              onChangeText={setOrderId}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>অর্ডারের ফোন নম্বর</Text>
            <TextInput
              style={s.input}
              placeholder="01XXXXXXXXX"
              placeholderTextColor={C.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
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
              <Text style={s.submitBtnText}>অর্ডার দেখুন →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tracking Result View */}
        {result && (
          <View style={s.resultCard}>
            <View style={s.resultHead}>
              <View>
                <Text style={s.resultId}>অর্ডার #{result.id}</Text>
                <Text style={s.resultStatus}>
                  {STATUS_LABELS[result.status] || result.status}
                </Text>
              </View>
              <Text style={s.resultTotal}>{taka(Number(result.total))}</Text>
            </View>

            {/* Step Timeline */}
            <View style={s.timeline}>
              {STEPS.map((step, idx) => {
                const isDone = idx <= currentStep && result.status !== 'cancelled';
                const isCurrent = idx === currentStep;
                return (
                  <View key={step} style={s.timelineStep}>
                    <View style={[s.stepCircle, isDone && s.stepCircleDone]}>
                      <Text style={[s.stepNum, isDone && s.stepNumDone]}>
                        {isDone ? '✓' : idx + 1}
                      </Text>
                    </View>
                    <View style={s.stepContent}>
                      <Text style={[s.stepLabel, isDone && s.stepLabelDone]}>
                        {STATUS_LABELS[step]}
                      </Text>
                      {isCurrent && <Text style={s.currentTag}>বর্তমান অবস্থা</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={s.dateText}>
              অর্ডার করার সময়: {new Date(result.created_at).toLocaleDateString('bn-BD')}
            </Text>
          </View>
        )}

        {/* Support Help */}
        <View style={s.helpCard}>
          <Text style={s.helpText}>
            অর্ডার নম্বর খুঁজে না পেলে অথবা কোনো সাহায্য লাগলে আমাদের সাথে হোয়াটসঅ্যাপে যোগাযোগ করুন।
          </Text>
          <TouchableOpacity
            style={s.waLink}
            onPress={() => Linking.openURL(WHATSAPP)}
            activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={s.waLinkText}>হোয়াটসঅ্যাপে সহায়তা নিন</Text>
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
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
    marginBottom: 14,
  },
  resultHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
  },
  resultId: {
    fontSize: 13,
    color: C.muted,
  },
  resultStatus: {
    fontSize: 18,
    fontWeight: '900',
    color: C.forest,
  },
  resultTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: C.forest,
  },
  timeline: {
    gap: 12,
    marginVertical: 6,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ece6d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: C.forest,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: C.coffee,
  },
  stepNumDone: {
    color: C.gold,
  },
  stepContent: {
    flex: 1,
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
  currentTag: {
    fontSize: 10,
    fontWeight: '800',
    color: C.emerald,
  },
  dateText: {
    fontSize: 11,
    color: C.muted,
    marginTop: 12,
    textAlign: 'center',
  },
  helpCard: {
    backgroundColor: 'rgba(23, 63, 53, 0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
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


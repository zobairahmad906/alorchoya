import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { C } from '@/constants/theme';

export const SMART_AGENT_EMBED_URL =
  'https://dev.newsmartagent.com/widget/embed/9d94fbd8-167a-42d2-b3e8-389062ca8b49/';

export default function SmartAgentChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleReload = () => {
    setLoading(true);
    setHasError(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={C.forest} />
        </TouchableOpacity>

        <View style={s.headerTitleWrap}>
          <View style={s.headerTitleRow}>
            <Text style={s.botIcon}>🤖</Text>
            <Text style={s.headerTitle}>স্মার্ট এআই এজেন্ট</Text>
          </View>
          <Text style={s.headerSubtitle}>আলোর ছোঁয়া লাইভ কাস্টমার সাপোর্ট</Text>
        </View>

        <TouchableOpacity
          style={s.headerBtn}
          onPress={handleReload}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={C.forest} />
        </TouchableOpacity>
      </View>

      {/* Main WebView Content */}
      <View style={s.webViewContainer}>
        {Platform.OS === 'web' ? (
          // Web platform compatibility using iframe
          // @ts-ignore
          <iframe
            src={SMART_AGENT_EMBED_URL}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="NewSmartAgent AI Chatbot"
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: SMART_AGENT_EMBED_URL }}
            style={s.webView}
            onLoadStart={() => {
              setLoading(true);
              setHasError(false);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            originWhitelist={['*']}
          />
        )}

        {/* Loading Spinner */}
        {loading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color={C.forest} />
            <Text style={s.loadingText}>এআই এজেন্ট সংযুক্ত হচ্ছে...</Text>
          </View>
        )}

        {/* Error Fallback */}
        {hasError && !loading && (
          <View style={s.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#b83f4b" />
            <Text style={s.errorTitle}>সংযোগ করা সম্ভব হয়নি</Text>
            <Text style={s.errorDesc}>ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।</Text>
            <TouchableOpacity style={s.retryBtn} onPress={handleReload} activeOpacity={0.8}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={s.retryBtnText}>আবার চেষ্টা করুন</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.ivory,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: C.ivory,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 63, 53, 0.06)',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.forest,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.forest,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.forest,
  },
  errorDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.forest,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

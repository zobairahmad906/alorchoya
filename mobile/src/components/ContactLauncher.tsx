import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';
import { WHATSAPP } from '@/lib/api';

const TEASERS = [
  'পণ্য সম্পর্কে জানতে মেসেজ করুন',
  'সহায়তার জন্য চ্যাট করুন',
  'সরাসরি হোয়াটসঅ্যাপে কথা বলুন',
];

export function ContactLauncher() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [teaserIdx, setTeaserIdx] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showTeaser, setShowTeaser] = useState(true);

  // Typewriter effect matching the web app
  useEffect(() => {
    if (open) {
      setShowTeaser(false);
      return;
    }
    const currentTeaser = TEASERS[teaserIdx];
    let charIndex = 0;
    setDisplayText('');
    setShowTeaser(true);

    const typeTimer = setInterval(() => {
      charIndex++;
      setDisplayText(currentTeaser.slice(0, charIndex));
      if (charIndex >= currentTeaser.length) {
        clearInterval(typeTimer);
        // After full text is typed, wait and switch to next teaser
        setTimeout(() => {
          setTeaserIdx((prev) => (prev + 1) % TEASERS.length);
        }, 4000);
      }
    }, 60);

    return () => clearInterval(typeTimer);
  }, [teaserIdx, open]);

  const openUrl = (url: string) => {
    setOpen(false);
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={[s.wrap, { bottom: 82 + insets.bottom }]}>
      {/* Typewriter Teaser Bubble */}
      {!open && showTeaser && displayText.length > 0 && (
        <TouchableOpacity
          style={s.teaserBubble}
          activeOpacity={0.8}
          onPress={() => setOpen(true)}>
          <Text style={s.teaserText}>{displayText}</Text>
          <Text style={s.teaserCaret}>|</Text>
        </TouchableOpacity>
      )}

      {/* Expanded Options */}
      {open && (
        <View style={s.optionsCol}>
          <TouchableOpacity
            style={[s.optionBtn, { backgroundColor: '#25D366' }]}
            onPress={() => openUrl(WHATSAPP)}
            activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={s.optionText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.optionBtn, { backgroundColor: '#0084FF' }]}
            onPress={() => openUrl('https://m.me/alorchoyamart')}
            activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={s.optionText}>Messenger</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Trigger Button */}
      <TouchableOpacity
        style={s.launcherBtn}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}>
        <Ionicons name={open ? 'close' : 'chatbubbles'} size={24} color="#fff" />
        {!open && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadText}>1</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 14,
    zIndex: 80,
    alignItems: 'flex-end',
    gap: 8,
  },
  teaserBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: C.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 240,
  },
  teaserText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.forest,
  },
  teaserCaret: {
    fontSize: 14,
    color: '#b83f4b',
    fontWeight: '900',
    marginLeft: 2,
  },
  optionsCol: {
    gap: 8,
    alignItems: 'flex-end',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  launcherBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#b83f4b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.ivory,
    shadowColor: '#b83f4b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#b83f4b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#b83f4b',
    fontSize: 10,
    fontWeight: '900',
  },
});


import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EXERCISES } from '../data/exercises';

const { width: W, height: H } = Dimensions.get('window');
const ORANGE = '#E8842E';
const STORAGE_SAVED = 'saved_exercises_v1';
const BG = require('../assets/timer_bg.png');
const IS_TINY = H < 690;    
const IS_SMALL = H < 760;  
const IS_WIDE = W >= 390;   

export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const id = route.params?.id as string;
  const item = useMemo(() => EXERCISES.find(x => x.id === id), [id]);

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const aIn = useRef(new Animated.Value(0)).current;
  const aUp = useRef(new Animated.Value(16)).current;
  const aScale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    aIn.setValue(0);
    aUp.setValue(16);
    aScale.setValue(0.98);

    Animated.parallel([
      Animated.timing(aIn, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(aUp, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.spring(aScale, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
    ]).start();

    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_SAVED);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      setSaved(Array.isArray(ids) ? ids.includes(id) : false);
    })();
  }, [id, aIn, aUp, aScale]);

  if (!item) return null;

  const toggleSave = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_SAVED);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    const safe = Array.isArray(ids) ? ids : [];
    const next = safe.includes(item.id) ? safe.filter(x => x !== item.id) : [...safe, item.id];
    await AsyncStorage.setItem(STORAGE_SAVED, JSON.stringify(next));
    setSaved(next.includes(item.id));
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `${item.title}\n\n${item.desc}` });
    } catch {}
  };

  const onUnderstood = () => {
    setNoticeOpen(false);
    navigation.navigate('Training');
  };

  const topPad = insets.top + (IS_TINY ? 8 : 10);
  const bottomPad = Math.max(insets.bottom, 10);

  const BACK_SIZE = IS_TINY ? 44 : 48;
  const BACK_RADIUS = IS_TINY ? 13 : 14;

  const CARD_PAD = IS_TINY ? 14 : IS_SMALL ? 18 : 22;
  const CARD_R = IS_TINY ? 24 : 28;

  const PHOTO = IS_TINY ? 92 : IS_SMALL ? 112 : 130;
  const PHOTO_R = IS_TINY ? 18 : 20;

  const TITLE_FS = IS_TINY ? 16 : IS_SMALL ? 18 : 22;
  const DESC_FS = IS_TINY ? 12.8 : IS_SMALL ? 14 : 15.5;
  const DESC_LH = IS_TINY ? 18 : IS_SMALL ? 20 : 22;

  const BTN_H = IS_TINY ? 54 : 60;
  const BTN_R = IS_TINY ? 16 : 18;
  const BTN_FS = IS_TINY ? 15 : 16;

  const GAP_1 = IS_TINY ? 10 : 12;
  const GAP_2 = IS_TINY ? 14 : 20;

  const CARD_W = Math.min(W - 40, IS_WIDE ? 420 : 380);

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      <View style={[styles.header, { top: topPad, left: 18 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={[styles.backBtn, { width: BACK_SIZE, height: BACK_SIZE, borderRadius: BACK_RADIUS }]}>
          <Text style={[styles.backIcon, { fontSize: IS_TINY ? 26 : 30 }]}>‹</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + (IS_TINY ? 58 : 66),
          paddingHorizontal: 20,
          paddingBottom: bottomPad + 18,
          alignItems: 'center',
        }}
      >
        <Animated.View style={{ opacity: aIn, transform: [{ translateY: aUp }, { scale: aScale }], width: '100%', alignItems: 'center' }}>
          <View style={[styles.orangeCard, { padding: CARD_PAD, borderRadius: CARD_R, width: CARD_W }]}>
            <View style={[styles.photoBox, { width: PHOTO, height: PHOTO, borderRadius: PHOTO_R }]}>
              <Image source={item.image} style={styles.photo} resizeMode="contain" />
            </View>

            <Text
              style={[
                styles.title,
                {
                  fontSize: TITLE_FS,
                  marginBottom: IS_TINY ? 10 : 12,
                  maxWidth: '96%',
                },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View style={[styles.descContainer, { borderRadius: IS_TINY ? 14 : 16, padding: IS_TINY ? 10 : 12 }]}>
              <Text style={[styles.desc, { fontSize: DESC_FS, lineHeight: DESC_LH }]}>{item.desc}</Text>
            </View>
          </View>

          <View style={{ height: GAP_2 }} />
          <Pressable onPress={() => setNoticeOpen(true)} style={[styles.bigBtn, { height: BTN_H, borderRadius: BTN_R, width: CARD_W }]}>
            <Text style={[styles.bigBtnText, { fontSize: BTN_FS }]}>Open timer ⏱</Text>
          </Pressable>

          <View style={{ height: GAP_1 }} />

          <View style={{ width: CARD_W, flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={onShare} style={[styles.bigBtn, { flex: 1, height: BTN_H, borderRadius: BTN_R }]}>
              <Text style={[styles.bigBtnText, { fontSize: BTN_FS }]}>Share ↗</Text>
            </Pressable>

            <Pressable onPress={toggleSave} style={[styles.saveBtn, { width: BTN_H, height: BTN_H, borderRadius: BTN_R }]}>
              <Text style={[styles.saveIcon, { fontSize: IS_TINY ? 24 : 26 }]}>{saved ? '★' : '☆'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal transparent visible={noticeOpen} animationType="fade" onRequestClose={() => setNoticeOpen(false)}>
        <View style={styles.modalBack}>
          <View style={[styles.modalCard, { width: Math.min(W * 0.88, 360), padding: IS_TINY ? 16 : 20 }]}>
            <View style={[styles.modalPill, { paddingHorizontal: IS_TINY ? 16 : 20, paddingVertical: IS_TINY ? 7 : 8 }]}>
              <Text style={[styles.modalPillText, { fontSize: IS_TINY ? 13 : 14 }]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>

            <Text style={[styles.modalTitle, { fontSize: IS_TINY ? 16 : 18 }]}>Important Notice</Text>

            <Text style={[styles.modalText, { fontSize: IS_TINY ? 13 : 14, lineHeight: IS_TINY ? 18 : 20 }]}>
              Please consult a qualified healthcare or fitness specialist before starting any workout. Exercise responsibly and at your own risk.
            </Text>

            <Pressable onPress={onUnderstood} style={styles.modalLinkBtn}>
              <Text style={styles.modalLinkBlue}>Understood</Text>
            </Pressable>

            <Pressable onPress={() => setNoticeOpen(false)} style={styles.modalLinkBtn}>
              <Text style={styles.modalLinkRed}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  header: { position: 'absolute', zIndex: 10 },

  backBtn: {
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  backIcon: { color: '#fff', fontWeight: '900', marginTop: Platform.OS === 'ios' ? -2 : -4 },

  orangeCard: {
    backgroundColor: ORANGE,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  photoBox: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  photo: { width: '80%', height: '80%' },

  title: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  descContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  desc: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },

  bigBtn: {
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bigBtnText: { color: '#fff', fontWeight: '900' },

  saveBtn: {
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveIcon: { color: '#fff', fontWeight: '900' },

  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
  },
  modalPill: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    marginBottom: 14,
    maxWidth: '100%',
  },
  modalPillText: { color: '#fff', fontWeight: '900' },
  modalTitle: { color: '#111', fontWeight: '900', marginBottom: 8 },
  modalText: { color: '#444', textAlign: 'center', marginBottom: 14 },

  modalLinkBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  modalLinkBlue: { color: '#007AFF', fontWeight: '900', fontSize: 16 },
  modalLinkRed: { color: '#FF3B30', fontWeight: '900', fontSize: 16 },
});

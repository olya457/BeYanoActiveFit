import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { addMinutesForDay, getDayKey } from '../store/statsStore'; 

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 690;

const BG = require('../assets/timer_bg.png');

type Level = 'Beginner' | 'Intermediate' | 'Advanced';
type Step = 'select' | 'ready' | 'running' | 'over';

const ORANGE = '#E8842E';
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [level, setLevel] = useState<Level>('Beginner');
  const [step, setStep] = useState<Step>('select');

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<Level | null>(null);

  const durationSec = useMemo(() => {
    if (level === 'Beginner') return 3 * 60;
    if (level === 'Intermediate') return 5 * 60;
    return 8 * 60;
  }, [level]);

  const [left, setLeft] = useState(durationSec);

  const leftRef = useRef(left);
  useEffect(() => {
    leftRef.current = left;
  }, [left]);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const aIn = useRef(new Animated.Value(0)).current;
  const aUp = useRef(new Animated.Value(14)).current;
  const aScale = useRef(new Animated.Value(0.98)).current;

  const playEnter = () => {
    aIn.setValue(0);
    aUp.setValue(14);
    aScale.setValue(0.98);

    Animated.parallel([
      Animated.timing(aIn, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(aUp, { toValue: 0, duration: 240, useNativeDriver: true }),
      Animated.spring(aScale, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    playEnter();
  }, [step]);

  useEffect(() => {
    setLeft(durationSec);
  }, [durationSec]);

  useEffect(() => {
    if (step !== 'running') return;

    stopTick();
    tickRef.current = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) {
          stopTick();
          void finalizeAndSave(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => stopTick();
  }, [step]);

  const mm = Math.floor(left / 60);
  const ss = left % 60;

  const headerTop = insets.top + 10 + 20;

  const LVL_BTN_W = Math.min(W * 0.66, 260);
  const LVL_BTN_H = IS_TINY ? 40 : 42;
  const LVL_GAP = IS_TINY ? 12 : 14;

  const MAIN_BTN_W = Math.min(W * 0.78, 292);
  const MAIN_BTN_H = IS_TINY ? 56 : 60;

  const headerTitle = level;

  const goBack = () => {
    stopTick();

    if (noticeOpen) {
      setNoticeOpen(false);
      setPendingLevel(null);
      return;
    }

    if (step === 'ready') return setStep('select');
    if (step === 'running') return setStep('ready');
    if (step === 'over') return setStep('select');

    navigation.goBack();
  };

  const onSelectLevel = (lv: Level) => {
    stopTick();
    setPendingLevel(lv);
    setNoticeOpen(true);
  };

  const onUnderstood = () => {
    if (pendingLevel) {
      setLevel(pendingLevel);
      setPendingLevel(null);
      setStep('ready');
    }
    setNoticeOpen(false);
  };

  const onCancelNotice = () => {
    setPendingLevel(null);
    setNoticeOpen(false);
  };

  const startTraining = () => {
    setLeft(durationSec);
    leftRef.current = durationSec;
    setStep('running');
  };
  const finalizeAndSave = async (autoFinished: boolean) => {
    stopTick();

    const performedSec = Math.max(0, durationSec - leftRef.current);
    const finalSec = autoFinished ? durationSec : performedSec;
    const minutes = Math.max(1, Math.ceil(finalSec / 60));

    await addMinutesForDay(getDayKey(), minutes);

    setStep('over');
  };

  const endRound = () => {
    void finalizeAndSave(false);
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      <View style={[styles.header, { top: headerTop }]}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter} pointerEvents="none">
          <View style={{ position: 'relative' }}>
            <Text style={styles.headerTitleStroke}>{headerTitle}</Text>
            <Text style={styles.headerTitleFill}>{headerTitle}</Text>
          </View>
        </View>

        <View style={styles.headerRightSpace} />
      </View>

      <View style={styles.center}>
        <Animated.View style={{ opacity: aIn, transform: [{ translateY: aUp }, { scale: aScale }], alignItems: 'center' }}>
          {step === 'select' && (
            <View style={{ alignItems: 'center' }}>
              <OrangeBtn w={LVL_BTN_W} h={LVL_BTN_H} text="Beginner" onPress={() => onSelectLevel('Beginner')} />
              <View style={{ height: LVL_GAP }} />
              <OrangeBtn w={LVL_BTN_W} h={LVL_BTN_H} text="Intermediate" onPress={() => onSelectLevel('Intermediate')} />
              <View style={{ height: LVL_GAP }} />
              <OrangeBtn w={LVL_BTN_W} h={LVL_BTN_H} text="Advanced" onPress={() => onSelectLevel('Advanced')} />
            </View>
          )}

          {step === 'ready' && (
            <View style={{ alignItems: 'center' }}>
              <OrangeBtn w={LVL_BTN_W} h={LVL_BTN_H} text="Start training!" onPress={startTraining} />
            </View>
          )}

          {step === 'running' && (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.roundText}>Round 1</Text>
              <View style={{ height: IS_TINY ? 30 : 40 }} />
              <Text style={styles.timeBig}>
                00:{pad2(mm)}:{pad2(ss)}
              </Text>
              <View style={{ height: IS_TINY ? 26 : 32 }} />
              <OrangeBtn w={MAIN_BTN_W} h={MAIN_BTN_H} text="End the round" onPress={endRound} />
            </View>
          )}

          {step === 'over' && (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.overText}>Training is over!</Text>
            </View>
          )}
        </Animated.View>
      </View>

      <Modal transparent visible={noticeOpen} animationType="fade" onRequestClose={onCancelNotice}>
        <View style={styles.modalBack}>
          <View style={[styles.modalCard, { width: Math.min(W * 0.72, 300) }]}>
            <View style={styles.modalPill}>
              <Text style={styles.modalPillText}>{pendingLevel ?? level}</Text>
            </View>

            <Text style={styles.modalTitle}>Important Notice</Text>

            <Text style={styles.modalText}>
              Please consult a qualified healthcare or fitness specialist before starting any workout. Make sure the
              exercises and training level are suitable for your health condition. Exercise responsibly and at your own
              risk.
            </Text>

            <Pressable onPress={onUnderstood} style={styles.modalLinkBtn} hitSlop={10}>
              <Text style={styles.modalLinkBlue}>Understood</Text>
            </Pressable>

            <Pressable onPress={onCancelNotice} hitSlop={10}>
              <Text style={styles.modalLinkRed}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OrangeBtn({ w, h, text, onPress }: { w: number; h: number; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={[styles.btn, { width: w, height: h }]}>
      <Text style={styles.btnText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  backIcon: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: -2 },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleStroke: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 32,
    lineHeight: 36,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 0 },
    textShadowRadius: 1,
  },
  headerTitleFill: {
    textAlign: 'center',
    color: ORANGE,
    fontWeight: '900',
    fontSize: 32,
    lineHeight: 36,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  headerRightSpace: { width: 44, height: 44 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },

  btn: {
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  roundText: { color: ORANGE, fontWeight: '900', fontSize: 22, textAlign: 'center' },
  timeBig: { color: ORANGE, fontWeight: '900', fontSize: IS_TINY ? 56 : 62, textAlign: 'center', letterSpacing: 0.5 },
  overText: { color: ORANGE, fontWeight: '900', fontSize: 26, textAlign: 'center' },

  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, alignItems: 'center' },
  modalPill: { backgroundColor: ORANGE, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, marginBottom: 10, minWidth: 170, alignItems: 'center' },
  modalPillText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  modalTitle: { color: '#111', fontWeight: '900', fontSize: 14, marginBottom: 8 },
  modalText: { color: '#333', fontSize: 11, lineHeight: 15.5, textAlign: 'center', marginBottom: 10 },
  modalLinkBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  modalLinkBlue: { color: '#1E6CFF', fontWeight: '900', fontSize: 12 },
  modalLinkRed: { color: '#D02B2B', fontWeight: '900', fontSize: 12, marginTop: 2 },
});

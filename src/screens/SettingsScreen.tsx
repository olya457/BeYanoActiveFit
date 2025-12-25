import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { resetAllStats } from '../store/statsStore';

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 690;
const IS_SMALL = H < 760;

const BG = require('../assets/timer_bg.png');
const ORANGE = '#E8842E';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const [vibration, setVibration] = useState(true);
  const [notification, setNotification] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const aIn = useRef(new Animated.Value(0)).current;
  const aUp = useRef(new Animated.Value(16)).current;
  const aScale = useRef(new Animated.Value(0.98)).current;

  const playEnter = useCallback(() => {
    aIn.setValue(0);
    aUp.setValue(16);
    aScale.setValue(0.98);

    Animated.parallel([
      Animated.timing(aIn, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(aUp, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.spring(aScale, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
    ]).start();
  }, [aIn, aUp, aScale]);

  useFocusEffect(
    useCallback(() => {
      playEnter();
    }, [playEnter])
  );
  const spin = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startSpin = useCallback(() => {
    spin.setValue(0);
    spinLoopRef.current?.stop();
    spinLoopRef.current = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    spinLoopRef.current.start();
  }, [spin]);

  const stopSpin = useCallback(() => {
    spinLoopRef.current?.stop();
    spinLoopRef.current = null;
    spin.setValue(0);
  }, [spin]);

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const topSafe = insets.top + (IS_TINY ? 6 : 10);
  const bottomSafe = Math.max(insets.bottom, 10);

  const CARD_W = useMemo(() => Math.min(W * (IS_TINY ? 0.90 : 0.86), 420), []);
  const CARD_R = IS_TINY ? 14 : 16;
  const CARD_PAD = IS_TINY ? 14 : 16;

  const TITLE_FS = IS_TINY ? 33 : IS_SMALL ? 35 : 37;
  const TITLE_LH = IS_TINY ? 37 : IS_SMALL ? 39 : 41;

  const SHARE_H = IS_TINY ? 54 : 58;
  const SHARE_FS = IS_TINY ? 16 : 17;

  const onShare = async () => {
    try {
      await Share.share({ message: 'BeYano Active Fit' });
    } catch {}
  };

  const onResetPress = () => {
    if (resetting) return;
    setConfirmOpen(true);
  };

  const doReset = async () => {
    try {
      setResetting(true);
      startSpin();

      await resetAllStats();

      setConfirmOpen(false);
      if (Platform.OS === 'android') Alert.alert('Done', 'Statistics cleared.');
    } catch {
      Alert.alert('Error', 'Failed to clear statistics.');
    } finally {
      setResetting(false);
      stopSpin();
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={[styles.titleWrap, { top: topSafe, height: 56 }]}>
        <View style={{ position: 'relative' }}>
          <Text style={[styles.titleStroke, { fontSize: TITLE_FS, lineHeight: TITLE_LH }]}>Settings</Text>
          <Text style={[styles.titleFill, { fontSize: TITLE_FS, lineHeight: TITLE_LH }]}>Settings</Text>
        </View>
      </View>

      <View style={[styles.center, { paddingTop: topSafe + 56, paddingBottom: bottomSafe + 18 }]}>
        <Animated.View style={{ opacity: aIn, transform: [{ translateY: aUp }, { scale: aScale }] }}>
          <View style={[styles.card, { width: CARD_W, borderRadius: CARD_R, padding: CARD_PAD }]}>
            <RowButton
              label="Reset statistics"
              onPress={onResetPress}
              disabled={resetting}
              right={
                resetting ? (
                  <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                    <View style={styles.spinner} />
                  </Animated.View>
                ) : (
                  <Text style={styles.rowRightHint}>›</Text>
                )
              }
            />
            <Line />

            <RowSwitch label="Vibration" value={vibration} onChange={setVibration} />
            <Line />

            <RowSwitch label="Notification" value={notification} onChange={setNotification} />
          </View>

          <Pressable onPress={onShare} style={[styles.shareBtn, { width: CARD_W, height: SHARE_H, marginTop: IS_TINY ? 14 : 18 }]}>
            <Text style={[styles.shareText, { fontSize: SHARE_FS }]}>Share the app</Text>
            <Text style={[styles.shareIcon, { fontSize: SHARE_FS + 1 }]}>↗</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBack}>
          <View style={[styles.modalCard, { width: Math.min(W * 0.90, 420) }]}>
            <Text style={styles.modalTitle}>Reset statistics?</Text>
            <Text style={styles.modalText}>This will clear your activity history and streak.</Text>

            <View style={styles.modalBtns}>
              <Pressable onPress={() => setConfirmOpen(false)} style={[styles.modalBtn, styles.modalBtnGhost]}>
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={doReset}
                disabled={resetting}
                style={[styles.modalBtn, styles.modalBtnDanger, resetting && { opacity: 0.6 }]}
              >
                <Text style={styles.modalBtnDangerText}>{resetting ? 'Resetting…' : 'Reset'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RowSwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(0,0,0,0.22)', true: '#7BE36B' }}
        thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
        ios_backgroundColor="rgba(0,0,0,0.22)"
      />
    </View>
  );
}

function RowButton({
  label,
  onPress,
  right,
  disabled,
}: {
  label: string;
  onPress: () => void;
  right: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.row, disabled && { opacity: 0.6 }]} hitSlop={10}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </Pressable>
  );
}

function Line() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  titleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStroke: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 0 },
    textShadowRadius: 2,
  },
  titleFill: {
    textAlign: 'center',
    color: ORANGE,
    fontWeight: '900',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
  },

  row: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { color: ORANGE, fontWeight: '900', fontSize: 16 },
  rowRightHint: { color: 'rgba(0,0,0,0.35)', fontWeight: '900', fontSize: 20, marginTop: -2 },

  spinner: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2.2,
    borderColor: 'rgba(0,0,0,0.18)',
    borderTopColor: 'rgba(0,0,0,0.55)',
  },

  line: { height: 1.5, backgroundColor: 'rgba(232,132,46,0.55)', marginVertical: 2 },

  shareBtn: {
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  shareText: { color: '#fff', fontWeight: '900' },
  shareIcon: { color: '#fff', fontWeight: '900' },

  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: ORANGE,
    padding: 16,
  },
  modalTitle: { color: '#111', fontWeight: '900', fontSize: 18, marginBottom: 6 },
  modalText: { color: 'rgba(0,0,0,0.65)', fontWeight: '700', fontSize: 14, lineHeight: 19 },

  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBtnGhost: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  modalBtnGhostText: { color: 'rgba(0,0,0,0.70)', fontWeight: '900' },

  modalBtnDanger: { backgroundColor: ORANGE },
  modalBtnDangerText: { color: '#fff', fontWeight: '900' },
});

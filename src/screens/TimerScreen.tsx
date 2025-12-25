import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import { addMinutesForDay, getDayKey } from '../store/statsStore';

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 750;
const IS_TINY = H < 690;

const BG = require('../assets/timer_bg.png');
const APP_ICON = require('../assets/app_icon.png');

const BTN_START_IMG = require('../assets/btn_clock.png');
const BTN_ADV_IMG = require('../assets/btn_advanced.png');

const BTN_PLAY = require('../assets/btn_play.png');
const BTN_PAUSE = require('../assets/btn_pause.png');
const BTN_RESET = require('../assets/btn_reset.png');

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

type Mode = 'setup' | 'run';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);

  const [mode, setMode] = useState<Mode>('setup');
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [running, setRunning] = useState(false);

  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const totalSelected = useMemo(() => hours * 3600 + minutes * 60 + seconds, [hours, minutes, seconds]);

  const savedOnceRef = useRef(false);

  const stopTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  useFocusEffect(
    React.useCallback(() => {
      stopTick();
      setRunning(false);
      setMode('setup');

      setHours(0);
      setMinutes(15);
      setSeconds(0);

      setSecondsLeft(15 * 60);
      savedOnceRef.current = false;

      return () => {
        stopTick();
        setRunning(false);
      };
    }, [])
  );
  const aIn = useRef(new Animated.Value(0)).current;
  const aUp = useRef(new Animated.Value(16)).current;
  const aIcon = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    aIn.setValue(0);
    aUp.setValue(16);
    aIcon.setValue(0.92);

    Animated.parallel([
      Animated.timing(aIn, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(aUp, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.spring(aIcon, { toValue: 1, speed: 16, bounciness: 8, useNativeDriver: true }),
    ]).start();
  }, [mode, aIn, aUp, aIcon]);

  const saveToStats = async () => {
    if (savedOnceRef.current) return;
    savedOnceRef.current = true;

    const finalSec = Math.max(1, totalSelected);
    const mins = Math.max(1, Math.ceil(finalSec / 60));

    await addMinutesForDay(getDayKey(), mins);
  };
  useEffect(() => {
    if (!running) return;

    stopTick();
    tickRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          stopTick();
          setRunning(false);

          void saveToStats();

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => stopTick();
  }, [running]);

  const startTimer = () => {
    const total = Math.max(1, totalSelected);
    setSecondsLeft(total);
    setRunning(false);
    savedOnceRef.current = false;
    setMode('run');
  };

  const resetToSetup = () => {
    stopTick();
    setRunning(false);
    setMode('setup');
    setSecondsLeft(Math.max(1, totalSelected));
    savedOnceRef.current = false;
  };

  const onAdvancedPress = () => {
    navigation.navigate('Training');
  };

  const hh = Math.floor(secondsLeft / 3600);
  const mm = Math.floor((secondsLeft % 3600) / 60);
  const ss = secondsLeft % 60;
  const ICON = IS_TINY ? 64 : IS_SMALL ? 70 : 78;
  const PICKER_H = IS_TINY ? 128 : 140;
  const PICKER_W = Platform.select({ ios: IS_TINY ? 88 : 92, android: 112 }) as number;

  const BTN_W = Math.min(W * 0.88, 360);
  const BTN_H = IS_TINY ? 58 : 64;
  const BTN_GAP = IS_TINY ? 12 : 16;

  const bottomSafe = Math.max(insets.bottom, 10);

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      {mode === 'setup' ? (
        <View style={[styles.wrap, { paddingBottom: bottomSafe + (IS_TINY ? 10 : 18) }]}>
          <Animated.View style={{ opacity: aIn, transform: [{ translateY: aUp }] }}>
            <Animated.View style={{ transform: [{ scale: aIcon }], alignItems: 'center' }}>
              <Image source={APP_ICON} style={{ width: ICON, height: ICON }} resizeMode="contain" />
            </Animated.View>

            <View style={[styles.pickerRow, { marginTop: IS_TINY ? 10 : 14 }]}>
              <PickerCol
                label="Hours"
                width={PICKER_W}
                height={PICKER_H}
                value={hours}
                onChange={setHours}
                items={Array.from({ length: 3 }).map((_, i) => i)}
              />
              <PickerCol
                label="Min"
                width={PICKER_W}
                height={PICKER_H}
                value={minutes}
                onChange={setMinutes}
                items={Array.from({ length: 60 }).map((_, i) => i)}
              />
              <PickerCol
                label="Sec"
                width={PICKER_W}
                height={PICKER_H}
                value={seconds}
                onChange={setSeconds}
                items={Array.from({ length: 60 }).map((_, i) => i)}
              />
            </View>

            <View style={{ marginTop: IS_TINY ? 10 : 14 }}>
              <Pressable onPress={startTimer} hitSlop={10} style={{ marginBottom: BTN_GAP }}>
                <Image source={BTN_START_IMG} style={{ width: BTN_W, height: BTN_H }} resizeMode="contain" />
              </Pressable>

              <Pressable onPress={onAdvancedPress} hitSlop={10}>
                <Image source={BTN_ADV_IMG} style={{ width: BTN_W, height: BTN_H }} resizeMode="contain" />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      ) : (
        <View style={[styles.wrap, { paddingBottom: bottomSafe + 22 }]}>
          <Animated.View style={{ opacity: aIn, transform: [{ translateY: aUp }] }}>
            <Animated.View style={{ transform: [{ scale: aIcon }], alignItems: 'center' }}>
              <Image source={APP_ICON} style={{ width: ICON, height: ICON }} resizeMode="contain" />
            </Animated.View>

            <Text
              allowFontScaling={Platform.OS === 'android' ? false : true}
              style={[styles.time, { marginTop: IS_TINY ? 12 : 18 }]}
            >
              {pad2(hh)}:{pad2(mm)}:{pad2(ss)}
            </Text>

            <Text style={styles.state}>{running ? 'Running' : 'Paused'}</Text>

            <View style={styles.controlsRow}>
              <Pressable onPress={() => setRunning(v => !v)} hitSlop={10}>
                <Image source={running ? BTN_PAUSE : BTN_PLAY} style={styles.ctrlBtn} />
              </Pressable>

              <Pressable onPress={resetToSetup} hitSlop={10}>
                <Image source={BTN_RESET} style={styles.ctrlBtn} />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function PickerCol({
  label,
  width,
  height,
  value,
  onChange,
  items,
}: {
  label: string;
  width: number;
  height: number;
  value: number;
  onChange: (v: number) => void;
  items: number[];
}) {
  return (
    <View style={styles.pickerCol}>
      <Picker
        selectedValue={value}
        onValueChange={(v: number) => onChange(v)}
        style={{ width, height }}
        itemStyle={styles.pickerItem}
      >
        {items.map(v => (
          <Picker.Item key={`${label}_${v}`} label={String(v)} value={v} />
        ))}
      </Picker>
      <Text style={styles.pickerLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pickerCol: { alignItems: 'center' },
  pickerItem: { fontSize: 16, fontWeight: '700', color: '#000' },
  pickerLabel: { marginTop: 6, fontSize: 14, fontWeight: '900', color: '#000' },

  time: {
    fontSize: 56,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    ...(Platform.OS === 'android'
      ? {
          fontFamily: 'monospace',
          letterSpacing: 0,
          includeFontPadding: false,
        }
      : null),
  },

  state: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'center',
  },

  controlsRow: { flexDirection: 'row', gap: 18, alignItems: 'center', justifyContent: 'center' },
  ctrlBtn: { width: 56, height: 56 },
});

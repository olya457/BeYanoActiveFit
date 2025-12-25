import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useFocusEffect } from '@react-navigation/native';
import {
  computeStreak,
  getDayKey,
  getLastMilestoneShown,
  loadDays,
  pad2,
  setLastMilestoneShown,
  type StatDay,
} from '../store/statsStore';

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 690;
const IS_SMALL = H < 760;

const BG = require('../assets/timer_bg.png');
const ORANGE = '#E8842E';

const CAL_COLS = 7;
const getMonthDays = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dayKey = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    return { day: d, dayKey };
  });
};

const monthTitle = (date = new Date()) => {
  const m = date.toLocaleString('en-US', { month: 'long' });
  const y = date.getFullYear();
  return `${m} ${y}`;
};

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();

  const [days, setDays] = useState<StatDay[]>([]);
  const [streak, setStreak] = useState(0);

  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{
    dayKey: string;
    day: number;
    minutes: number;
    byMode?: Record<string, number>;
  } | null>(null);

  const shotRef = useRef<ViewShot>(null);
  const aIn = useRef(new Animated.Value(0)).current;
  const aUp = useRef(new Animated.Value(16)).current;
  const aScale = useRef(new Animated.Value(0.98)).current;
  const mFade = useRef(new Animated.Value(0)).current;
  const mUp = useRef(new Animated.Value(18)).current;
  const mScale = useRef(new Animated.Value(0.98)).current;

  const playEnter = () => {
    aIn.setValue(0);
    aUp.setValue(16);
    aScale.setValue(0.98);

    Animated.parallel([
      Animated.timing(aIn, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(aUp, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.spring(aScale, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
    ]).start();
  };

  const playModalIn = () => {
    mFade.setValue(0);
    mUp.setValue(18);
    mScale.setValue(0.98);

    Animated.parallel([
      Animated.timing(mFade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(mUp, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.spring(mScale, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
    ]).start();
  };

  const refresh = async () => {
    const list = await loadDays();
    setDays(list);

    const s = computeStreak(list);
    setStreak(s);
    if (s >= 7) {
      const lastShown = await getLastMilestoneShown();
      if (lastShown < 7) {
        setMilestoneOpen(true);
        await setLastMilestoneShown(7);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
      playEnter();
    }, [])
  );

  useEffect(() => {
    if (milestoneOpen) playModalIn();
  }, [milestoneOpen]);

  useEffect(() => {
    if (dayOpen) playModalIn();
  }, [dayOpen]);

  const todayKey = getDayKey();
  const monthCells = useMemo(() => {
    const map = new Map(days.map(d => [d.dayKey, d]));
    return getMonthDays().map(cell => {
      const stat = map.get(cell.dayKey);
      const minutes = stat?.minutes ?? 0;

      return {
        day: cell.day,
        dayKey: cell.dayKey,
        minutes,
        byMode: stat?.byMode,
        active: minutes > 0,
        isToday: cell.dayKey === todayKey,
      };
    });
  }, [days, todayKey]);
  const calendarRows = useMemo(() => {
    const rows: typeof monthCells[] = [];
    for (let i = 0; i < monthCells.length; i += CAL_COLS) {
      rows.push(monthCells.slice(i, i + CAL_COLS));
    }
    return rows;
  }, [monthCells]);

  const openDayModal = (cell: (typeof monthCells)[number]) => {
    if (!cell.active) return;
    setSelectedDay({
      dayKey: cell.dayKey,
      day: cell.day,
      minutes: cell.minutes,
      byMode: cell.byMode,
    });
    setDayOpen(true);
  };

  const shareImage = async () => {
    try {
      if (!shotRef.current) return;
      const uri = await captureRef(shotRef, { format: 'png', quality: 1 });
      await Share.share({
        url: uri,
        message: `BeYano Active Fit\nStreak: ${streak} day(s)`,
      });
    } catch {}
  };
  const topSafe = insets.top + (IS_TINY ? 8 : 10);
  const bottomSafe = Math.max(insets.bottom, 12);

  const TITLE_FS = IS_TINY ? 30 : IS_SMALL ? 32 : 34;
  const TITLE_LH = IS_TINY ? 34 : IS_SMALL ? 36 : 38;

  const CARD_W = Math.min(W * (IS_TINY ? 0.90 : 0.86), 420);
  const CARD_PAD = IS_TINY ? 12 : 14;

  const INNER_PAD = IS_TINY ? 10 : 12;
  const GRID_GAP = IS_TINY ? 7 : 8;

  const cellW = Math.floor(
    (CARD_W - CARD_PAD * 2 - INNER_PAD * 2 - (CAL_COLS - 1) * GRID_GAP) / CAL_COLS
  );
  const cellH = Math.max(IS_TINY ? 30 : 34, Math.floor(cellW * 1.05));
  const SHARE_H = IS_TINY ? 50 : 54;
  const modeLines = useMemo(() => {
    if (!selectedDay?.byMode) return [];
    const entries = Object.entries(selectedDay.byMode)
      .filter(([, v]) => (v ?? 0) > 0)
      .sort((a, b) => b[1] - a[1]);
    return entries.map(([k, v]) => ({ mode: k, minutes: v }));
  }, [selectedDay]);

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={[styles.titleWrap, { top: topSafe, height: 52 }]}>
        <View style={{ position: 'relative' }}>
          <Text style={[styles.titleStroke, { fontSize: TITLE_FS, lineHeight: TITLE_LH }]}>Statistics</Text>
          <Text style={[styles.titleFill, { fontSize: TITLE_FS, lineHeight: TITLE_LH }]}>Statistics</Text>
        </View>
      </View>

      <View style={[styles.center, { paddingTop: topSafe + 46, paddingBottom: bottomSafe + 18 }]}>
        <Animated.View style={{ opacity: aIn, transform: [{ translateY: aUp }, { scale: aScale }] }}>
          <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }}>
            <View style={[styles.bigCard, { width: CARD_W, padding: CARD_PAD }]}>
              <Text style={[styles.monthTitle, { marginBottom: IS_TINY ? 8 : 10 }]}>
                {monthTitle()}
              </Text>

              <View style={[styles.innerCard, { padding: INNER_PAD }]}>
                <View style={{ gap: GRID_GAP }}>
                  {calendarRows.map((row, rIdx) => (
                    <View key={`row_${rIdx}`} style={{ flexDirection: 'row', gap: GRID_GAP }}>
                      {row.map(cell => (
                        <Pressable
                          key={cell.dayKey}
                          onPress={() => openDayModal(cell)}
                          style={[
                            styles.cell,
                            {
                              width: cellW,
                              height: cellH,
                              backgroundColor: cell.active ? ORANGE : 'transparent',
                              borderColor: cell.isToday ? '#000' : ORANGE,
                              borderWidth: cell.isToday ? 2.5 : 1.5,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cellText,
                              {
                                color: cell.active ? '#fff' : 'rgba(0,0,0,0.55)',
                                fontWeight: cell.isToday ? '900' : '800',
                              },
                            ]}
                          >
                            {cell.day}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              </View>

              <Pressable onPress={shareImage} style={[styles.shareBtn, { height: SHARE_H }]}>
                <Text style={styles.shareText}>Share</Text>
                <Text style={styles.shareIcon}>↗</Text>
              </Pressable>
            </View>
          </ViewShot>
        </Animated.View>
      </View>

      <Modal transparent visible={milestoneOpen} animationType="fade" onRequestClose={() => setMilestoneOpen(false)}>
        <View style={styles.modalBack}>
          <Animated.View style={{ opacity: mFade, transform: [{ translateY: mUp }, { scale: mScale }] }}>
            <View style={[styles.modalCard, { width: Math.min(W * 0.84, 360) }]}>
              <View style={styles.modalMessage}>
                <Text style={styles.modalText}>You do the exercises</Text>
                <Text style={styles.modalTextBig}>7 days in a row!</Text>
              </View>

              <Pressable onPress={shareImage} style={styles.modalShare}>
                <Text style={styles.modalShareText}>Share</Text>
                <Text style={styles.modalShareIcon}>↗</Text>
              </Pressable>

              <Pressable onPress={() => setMilestoneOpen(false)} hitSlop={10} style={{ marginTop: 10 }}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
      <Modal transparent visible={dayOpen} animationType="fade" onRequestClose={() => setDayOpen(false)}>
        <View style={styles.modalBack}>
          <Animated.View style={{ opacity: mFade, transform: [{ translateY: mUp }, { scale: mScale }] }}>
            <View style={[styles.dayModalCard, { width: Math.min(W * 0.88, 420) }]}>
              <View style={styles.modalMessage}>
                <Text style={styles.dayTitle}>
                  Day {selectedDay?.day ?? ''} • {selectedDay?.dayKey ?? ''}
                </Text>
                <Text style={styles.dayMinutes}>
                  {selectedDay?.minutes ?? 0} min total
                </Text>
              </View>
              <View style={styles.modesBox}>
                {modeLines.length === 0 ? (
                  <Text style={styles.modesEmpty}>No mode breakdown saved.</Text>
                ) : (
                  modeLines.map(line => (
                    <View key={line.mode} style={styles.modeRow}>
                      <Text style={styles.modeName}>{line.mode}</Text>
                      <Text style={styles.modeVal}>{line.minutes} min</Text>
                    </View>
                  ))
                )}
              </View>

              <Pressable onPress={() => setDayOpen(false)} style={[styles.modalShare, { marginTop: 12 }]}>
                <Text style={styles.modalShareText}>Close</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
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

  bigCard: {
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 2,
    borderColor: ORANGE,
  },

  monthTitle: {
    color: 'rgba(0,0,0,0.55)',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },

  innerCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2,
    borderColor: ORANGE,
  },

  cell: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cellText: {
    fontSize: 13,
    textAlign: 'center',
  },

  shareBtn: {
    marginTop: 14,
    backgroundColor: ORANGE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  shareText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  shareIcon: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: ORANGE,
    padding: 16,
    alignItems: 'center',
  },
  modalMessage: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: ORANGE,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalText: { color: ORANGE, fontWeight: '900', fontSize: 14, textAlign: 'center' },
  modalTextBig: { color: ORANGE, fontWeight: '900', fontSize: 20, textAlign: 'center', marginTop: 2 },

  modalShare: {
    height: 54,
    width: '100%',
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  modalShareText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalShareIcon: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalClose: { color: 'rgba(0,0,0,0.55)', fontWeight: '900' },
  dayModalCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: ORANGE,
    padding: 16,
    alignItems: 'center',
  },
  dayTitle: { color: ORANGE, fontWeight: '900', fontSize: 14, textAlign: 'center' },
  dayMinutes: { color: ORANGE, fontWeight: '900', fontSize: 18, textAlign: 'center', marginTop: 4 },

  modesBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: ORANGE,
    padding: 12,
  },
  modesEmpty: { color: 'rgba(0,0,0,0.55)', fontWeight: '800', textAlign: 'center' },

  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  modeName: { color: ORANGE, fontWeight: '900' },
  modeVal: { color: 'rgba(0,0,0,0.60)', fontWeight: '900' },
});

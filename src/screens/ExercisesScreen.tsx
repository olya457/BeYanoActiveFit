import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { EXERCISES, type Ex } from '../data/exercises';

const { width: W, height: H } = Dimensions.get('window');

const IS_SMALL = H < 750;
const IS_TINY = H < 690;

const ORANGE = '#E8842E';
const STORAGE_SAVED = 'saved_exercises_v1';
const BG = require('../assets/timer_bg.png');

type Tab = 'All' | 'Saved';

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [tab, setTab] = useState<Tab>('All');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const aScreen = useRef(new Animated.Value(0)).current;

  const playEnter = () => {
    aScreen.setValue(0);
    Animated.timing(aScreen, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const loadSaved = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_SAVED);
      if (!raw) return setSavedIds([]);
      const parsed = JSON.parse(raw);
      setSavedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedIds([]);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener?.('focus', () => {
      loadSaved();
      playEnter();
    });
    loadSaved();
    playEnter();
    return unsub;
  }, [navigation]);

  const data = useMemo(() => {
    if (tab === 'All') return EXERCISES;
    return EXERCISES.filter(x => savedIds.includes(x.id));
  }, [tab, savedIds]);

  const PAD_H = IS_TINY ? 14 : 18;
  const SEG_H = IS_TINY ? 44 : 46;
  const SEG_R = IS_TINY ? 14 : 16;
  const ROW_GAP = 20; 
  const COL_GAP = IS_TINY ? 10 : 12;
  const CARD_W = Math.floor((W - PAD_H * 2 - COL_GAP) / 2);
  const CARD_H = IS_TINY ? 138 : IS_SMALL ? 146 : 150;
  const IMG_H = IS_TINY ? 82 : IS_SMALL ? 88 : 92;

  const TITLE_FS = IS_TINY ? 11.5 : 12;

  const EXTRA_SCROLL = 30;
  const TABBAR_SAFE = IS_TINY ? 110 : 95;

  const itemOpacity = aScreen.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const itemTranslate = aScreen.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  const openDetail = (item: Ex) => {
    navigation.navigate('ExerciseDetail', { id: item.id });
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      <Animated.View
        style={{
          flex: 1,
          opacity: aScreen,
          transform: [{ translateY: aScreen.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <View style={{ paddingTop: insets.top + (IS_TINY ? 8 : 10), paddingHorizontal: PAD_H }}>
          <View style={[styles.segment, { height: SEG_H, borderRadius: SEG_R }]}>
            <Pressable
              onPress={() => { setTab('All'); playEnter(); }}
              style={[
                styles.segmentItem,
                { height: SEG_H - 8, borderRadius: SEG_R - 2 },
                tab === 'All' && styles.segmentItemActive,
              ]}
            >
              <Text style={[styles.segmentText, { fontSize: IS_TINY ? 12.5 : 13 }, tab === 'All' && styles.segmentTextActive]}>
                All
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { setTab('Saved'); playEnter(); }}
              style={[
                styles.segmentItem,
                { height: SEG_H - 8, borderRadius: SEG_R - 2 },
                tab === 'Saved' && styles.segmentItemActive,
              ]}
            >
              <Text style={[styles.segmentText, { fontSize: IS_TINY ? 12.5 : 13 }, tab === 'Saved' && styles.segmentTextActive]}>
                Saved
              </Text>
            </Pressable>
          </View>
          <View style={{ height: IS_TINY ? 12 : 14 }} />
        </View>

        <FlatList
          data={data}
          keyExtractor={i => i.id}
          numColumns={2} 
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: ROW_GAP }} />}
          
          columnWrapperStyle={{
            paddingHorizontal: PAD_H,
            justifyContent: 'space-between',
          }}
          contentContainerStyle={{
            paddingTop: 0,
            paddingBottom: insets.bottom + TABBAR_SAFE + EXTRA_SCROLL,
          }}
          renderItem={({ item }) => (
            <Animated.View style={{ opacity: itemOpacity, transform: [{ translateY: itemTranslate }] }}>
              <Pressable
                onPress={() => openDetail(item)}
                style={[
                  styles.card,
                  {
                    width: CARD_W,
                    height: CARD_H,
                    borderRadius: IS_TINY ? 18 : 20,
                    padding: IS_TINY ? 9 : 10,
                  },
                ]}
              >
                <View style={[styles.imgBox, { height: IMG_H, borderRadius: IS_TINY ? 16 : 18 }]}>
                  <Image source={item.image} style={styles.img} resizeMode="contain" />
                </View>

                <Text numberOfLines={1} style={[styles.cardTitle, { fontSize: TITLE_FS }]}>
                  {item.title}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  segment: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: ORANGE },
  segmentText: { color: '#fff', fontWeight: '900', opacity: 0.9 },
  segmentTextActive: { opacity: 1 },
  card: {
    borderWidth: 2,
    borderColor: ORANGE,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgBox: {
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  img: { width: '78%', height: '78%' },
  cardTitle: {
    color: ORANGE,
    fontWeight: '900',
    textAlign: 'center',
  },
});
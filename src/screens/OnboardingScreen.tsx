import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_SMALL = H < 750;

const BG = require('../assets/loader_bg2.png');

const LOGO3 = require('../assets/logo3.png');

const ON1 = require('../assets/onboard1.png');
const ON2 = require('../assets/onboard2.png');
const ON3 = require('../assets/onboard3.png');
const ON4 = require('../assets/onboard4.png');
const ON5 = require('../assets/onboard5.png');

type Page = {
  key: string;
  topText?: string;
  title?: string;
  button: string;
  image: any;
};

const PAGES: Page[] = [
  { key: '1', title: 'BeYano', button: 'Get Started', image: ON1 },
  {
    key: '2',
    topText:
      'BeYano Active Fit helps you train\nwithout distractions. Set your\npace, start the timer, and focus on\nmovement. No complicated plans,\njust a clean and simple way to stay\nactive.',
    button: 'Continue',
    image: ON2,
  },
  {
    key: '3',
    topText:
      'BeYano Active Fit helps you train\nwithout distractions. Set your\npace, start the timer, and focus on\nmovement. No complicated plans,\njust a clean and simple way to stay\nactive.',
    button: 'Continue',
    image: ON3,
  },
  {
    key: '4',
    topText:
      'BeYano Active Fit helps you train\nwithout distractions. Set your\npace, start the timer, and focus on\nmovement. No complicated plans,\njust a clean and simple way to stay\nactive.',
    button: 'Continue',
    image: ON4,
  },
  {
    key: '5',
    topText:
      'Please consult a qualified\nhealthcare or fitness specialist\nbefore starting any workout. Make\nsure the exercises and training\nlevel are suitable for your health\ncondition. Exercise responsibly and\nat your own risk.',
    button: 'Start Training',
    image: ON5,
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Page>>(null);
  const [index, setIndex] = useState(0);

  const page = PAGES[index];
  const isLast = index === PAGES.length - 1;

  const onPrimaryPress = () => {
    if (!isLast) {
      const next = index + 1;
      setIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      navigation.replace('MainTabs');
    }
  };

  const topOffset = insets.top + 40;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.topTextWrap, { top: topOffset }]}>
        {index === 0 ? (
          <Image source={LOGO3} style={styles.logo3} resizeMode="contain" />
        ) : (
          <Text style={styles.topText}>{page.topText}</Text>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: W }]}>
            <View style={styles.bottomPanel}>
              <Image source={item.image} style={styles.man} resizeMode="contain" />
              <Pressable style={styles.primary} onPress={onPrimaryPress}>
                <Text style={styles.primaryText}>{page.button}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </ImageBackground>
  );
}

const PANEL_H = Math.round(H * (IS_SMALL ? 0.56 : 0.58));

const styles = StyleSheet.create({
  bg: { flex: 1 },

  topTextWrap: {
    position: 'absolute',
    left: 26,
    right: 26,
    zIndex: 10,
    alignItems: 'center',
  },

  logo3: {
    width: Math.min(W * 0.62, 260),
    height: 70,
  },

  topText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },

  page: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  bottomPanel: {
    height: PANEL_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },

  man: {
    position: 'absolute',
    bottom: 72,
    width: Math.min(W * 0.78, 360),
    height: PANEL_H * 0.86,
  },

  primary: {
    width: Math.min(W * 0.72, 320),
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F08A2F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    marginBottom: 20,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.3,
    fontSize: 13,
  },
});

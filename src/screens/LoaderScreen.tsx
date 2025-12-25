import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ImageBackground, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const BG = require('../assets/loader_bg.png');
const LOGO = require('../assets/logo.png');
const LOGO1 = require('../assets/logo1.png');

type Phase = 'web' | 'logo' | 'logo1';

export default function LoaderScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<Phase>('web');

  useEffect(() => {
    let alive = true;

    const t1 = setTimeout(() => {
      if (!alive) return;
      setPhase('logo');
    }, 3000);

    const t2 = setTimeout(() => {
      if (!alive) return;
      setPhase('logo1');
    }, 6000);

    const t3 = setTimeout(() => {
      if (!alive) return;
      navigation.replace('Onboarding');
    }, 9000);

    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigation]);

  const html = useMemo(() => {
    return `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .loader {
    --color-one: #ffbf48;
    --color-two: #be4a1d;
    --color-three: #ffbf4780;
    --color-four: #bf4a1d80;
    --color-five: #ffbf4740;
    --time-animation: 2s;
    --size: 1;
    position: relative;
    border-radius: 50%;
    transform: scale(var(--size));
    box-shadow:
      0 0 25px 0 var(--color-three),
      0 20px 50px 0 var(--color-four);
    animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
  }

  .loader::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border-top: solid 1px var(--color-one);
    border-bottom: solid 1px var(--color-two);
    background: linear-gradient(180deg, var(--color-five), var(--color-four));
    box-shadow:
      inset 0 10px 10px 0 var(--color-three),
      inset 0 -10px 10px 0 var(--color-four);
  }

  .loader .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
    mask: url(#clipping);
    -webkit-mask: url(#clipping);
  }

  .loader svg { position: absolute; }

  .loader svg #clipping {
    filter: contrast(15);
    animation: roundness calc(var(--time-animation) / 2) linear infinite;
  }

  .loader svg #clipping polygon { filter: blur(7px); }

  .loader svg #clipping polygon:nth-child(1) {
    transform-origin: 75% 25%;
    transform: rotate(90deg);
  }

  .loader svg #clipping polygon:nth-child(2) {
    transform-origin: 50% 50%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(3) {
    transform-origin: 50% 60%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -3);
  }

  .loader svg #clipping polygon:nth-child(4) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(5) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
    animation-delay: calc(var(--time-animation) / -2);
  }

  .loader svg #clipping polygon:nth-child(6) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
  }

  .loader svg #clipping polygon:nth-child(7) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -1.5);
  }

  @keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes roundness {
    0% { filter: contrast(15); }
    20% { filter: contrast(3); }
    40% { filter: contrast(3); }
    60% { filter: contrast(15); }
    100% { filter: contrast(15); }
  }

  @keyframes colorize {
    0% { filter: hue-rotate(0deg); }
    20% { filter: hue-rotate(-30deg); }
    40% { filter: hue-rotate(-60deg); }
    60% { filter: hue-rotate(-90deg); }
    80% { filter: hue-rotate(-45deg); }
    100% { filter: hue-rotate(0deg); }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="loader">
      <div class="box"></div>
      <svg width="0" height="0">
        <defs>
          <mask id="clipping">
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="white"></polygon>
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="white"></polygon>
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="white"></polygon>
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="white"></polygon>
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="white"></polygon>
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="white"></polygon>
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="white"></polygon>
          </mask>
        </defs>
      </svg>
    </div>
  </div>
</body>
</html>
`;
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.center}>
        {phase === 'web' && (
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            style={styles.web}
            containerStyle={styles.webContainer}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
            setBuiltInZoomControls={false}
            androidLayerType="hardware"
          />
        )}

        {phase === 'logo' && (
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        )}

        {phase === 'logo1' && (
          <Image source={LOGO1} style={styles.logo} resizeMode="contain" />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: {
    width: 160,
    height: 160,
    backgroundColor: 'transparent',
  },
  web: {
    width: 160,
    height: 160,
    backgroundColor: 'transparent',
  },

  logo: {
    width: 190,
    height: 190,
  },
});

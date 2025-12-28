import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ImageBackground, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const BG = require('../assets/loader_bg.png');
const LOGO = require('../assets/logo.png');

type Phase = 'web' | 'logo';

export default function LoaderScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<Phase>('web');

  useEffect(() => {
    let alive = true;

    const t1 = setTimeout(() => {
      if (!alive) return;
      setPhase('logo');
    }, 5000);

    const t2 = setTimeout(() => {
      if (!alive) return;
      navigation.replace('Onboarding');
    }, 8000);

    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
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
  .num {
    font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif;
    font-weight: 900;
    font-size: 84px;
    line-height: 1;
    color: #ffbf48;
    text-shadow: 0 10px 30px rgba(0,0,0,0.35);
    transform: translateY(-2px);
    user-select: none;
    -webkit-user-select: none;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div id="n" class="num">5</div>
  </div>

<script>
  (function () {
    var el = document.getElementById('n');
    var v = 5;

    function tick() {
      el.textContent = String(v);
      v -= 1;
      if (v >= 1) setTimeout(tick, 1000);
    }

    setTimeout(tick, 1000);
  })();
</script>
</body>
</html>
`;
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.center}>
        {phase === 'web' ? (
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
        ) : (
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webContainer: { width: 200, height: 200, backgroundColor: 'transparent' },
  web: { width: 200, height: 200, backgroundColor: 'transparent' },
  logo: { width: 220, height: 220 },
});

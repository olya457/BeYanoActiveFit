import React from 'react';
import { Image, StyleSheet, View, Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList } from './types';

import TimerScreen from '../screens/TimerScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const { height: H } = Dimensions.get('window');
const Tab = createBottomTabNavigator<MainTabParamList>();
const ORANGE = '#E8842E';

const IS_TINY = H < 700;

const ICONS = {
  Timer: {
    on: require('../assets/timer_on.png'),
    off: require('../assets/timer_off.png'),
  },
  Exercises: {
    on: require('../assets/dumbbell_on.png'),
    off: require('../assets/dumbbell_off.png'),
  },
  Statistics: {
    on: require('../assets/stats_on.png'),
    off: require('../assets/stats_off.png'),
  },
  Settings: {
    on: require('../assets/settings_on.png'),
    off: require('../assets/settings_off.png'),
  },
} as const;

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const SIDE = IS_TINY ? 24 : 36;
  const BAR_H = IS_TINY ? 70 : 80;
  const ICON_SIZE = IS_TINY ? 36 : 44;
  const ICON_MARGIN = IS_TINY ? 25 : 40;
  const baseBottom = Math.max(insets.bottom, IS_TINY ? 10 : 15);
  const BOTTOM = Platform.OS === 'android' ? baseBottom + 20 : baseBottom;

  return (
    <Tab.Navigator
      key={`tabs_layout_${IS_TINY ? 'tiny' : 'normal'}`}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,

        tabBarStyle: [
          styles.tabBar,
          {
            height: BAR_H,
            left: SIDE,
            right: SIDE,
            bottom: BOTTOM,
            borderRadius: IS_TINY ? 30 : 40,
          },
        ],

        tabBarItemStyle: {
          height: BAR_H,
          justifyContent: 'center',
          alignItems: 'center',
        },

        tabBarIcon: ({ focused }) => {
          const key = route.name as keyof typeof ICONS;
          const src = focused ? ICONS[key].on : ICONS[key].off;

          return (
            <View style={[styles.iconWrap, { marginTop: ICON_MARGIN }]}>
              <Image
                source={src}
                style={{ width: ICON_SIZE, height: ICON_SIZE }}
                resizeMode="contain"
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: '#ffffffff',
    borderWidth: 2,
    borderColor: ORANGE,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  iconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';

export type StatMode = string; 

export type StatDay = {
  dayKey: string;            
  minutes: number;          
  byMode?: Record<StatMode, number>; 
};

const STORAGE_DAYS = 'stats_days_v2';       
const STORAGE_MILESTONE = 'stats_last_milestone_v1';

export const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const getDayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

export const addDays = (dayKey: string, delta: number) => {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + delta);
  return getDayKey(dt);
};


const sortDays = (list: StatDay[]) =>
  list.sort((a, b) => (a.dayKey > b.dayKey ? 1 : a.dayKey < b.dayKey ? -1 : 0));

const safeParse = (raw: string | null): StatDay[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(x => x && typeof x.dayKey === 'string')
      .map(x => {
        const minutes = Math.max(0, Math.floor(Number(x.minutes ?? 0)));
        const byModeRaw = x.byMode && typeof x.byMode === 'object' ? x.byMode : undefined;

        let byMode: Record<string, number> | undefined;
        if (byModeRaw) {
          byMode = {};
          for (const k of Object.keys(byModeRaw)) {
            const v = Math.max(0, Math.floor(Number(byModeRaw[k] ?? 0)));
            if (v > 0) byMode[k] = v;
          }
          if (Object.keys(byMode).length === 0) byMode = undefined;
        }

        return { dayKey: x.dayKey, minutes, byMode } as StatDay;
      });
  } catch {
    return [];
  }
};

export const loadDays = async (): Promise<StatDay[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_DAYS);
  return sortDays(safeParse(raw));
};

const saveDays = async (days: StatDay[]) => {
  await AsyncStorage.setItem(STORAGE_DAYS, JSON.stringify(sortDays(days)));
};
export const addMinutesForDay = async (dayKey: string, addMinutes: number, mode?: StatMode) => {
  const inc = Math.max(0, Math.floor(addMinutes));
  if (inc <= 0) return;

  const days = await loadDays();
  const idx = days.findIndex(d => d.dayKey === dayKey);

  if (idx >= 0) {
    const prev = days[idx];
    const next: StatDay = {
      ...prev,
      minutes: Math.max(0, Math.floor(prev.minutes + inc)),
      byMode: prev.byMode ? { ...prev.byMode } : undefined,
    };

    if (mode) {
      if (!next.byMode) next.byMode = {};
      next.byMode[mode] = Math.max(0, Math.floor((next.byMode[mode] ?? 0) + inc));
    }

    days[idx] = next;
  } else {
    const d: StatDay = { dayKey, minutes: inc };
    if (mode) d.byMode = { [mode]: inc };
    days.push(d);
  }

  await saveDays(days);
};

export const computeStreak = (days: StatDay[]) => {
  const map = new Map(days.map(d => [d.dayKey, d.minutes]));
  const today = getDayKey();

  let s = 0;
  for (let i = 0; i < 3650; i++) {
    const k = addDays(today, -i);
    const min = map.get(k) ?? 0;
    if (min > 0) s += 1;
    else break;
  }
  return s;
};

export const getLastMilestoneShown = async (): Promise<number> => {
  const raw = await AsyncStorage.getItem(STORAGE_MILESTONE);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
};

export const setLastMilestoneShown = async (value: number) => {
  const v = Math.max(0, Math.floor(value));
  await AsyncStorage.setItem(STORAGE_MILESTONE, String(v));
};
export const resetAllStats = async () => {
  await AsyncStorage.multiRemove([STORAGE_DAYS, STORAGE_MILESTONE]);
};

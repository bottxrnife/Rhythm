import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rhythm_settings';

type Settings = {
  demoMode: boolean;
};

const defaultSettings: Settings = {
  demoMode: false,
};

let cachedSettings: Settings | null = null;

export async function loadSettings(): Promise<Settings> {
  if (cachedSettings) return cachedSettings;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedSettings = { ...defaultSettings, ...JSON.parse(raw) };
    } else {
      cachedSettings = defaultSettings;
    }
  } catch {
    cachedSettings = defaultSettings;
  }
  return cachedSettings!;
}

export async function saveSettings(settings: Settings): Promise<void> {
  cachedSettings = settings;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function isDemoMode(): Promise<boolean> {
  const settings = await loadSettings();
  return settings.demoMode;
}
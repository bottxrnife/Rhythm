// We need to reset the module cache between tests since Settings caches internally
let loadSettings: typeof import('../Settings').loadSettings;
let saveSettings: typeof import('../Settings').saveSettings;
let isDemoMode: typeof import('../Settings').isDemoMode;

// Track mock storage
let mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
}));

beforeEach(() => {
  jest.resetModules();
  mockStorage = {};

  const mod = require('../Settings');
  loadSettings = mod.loadSettings;
  saveSettings = mod.saveSettings;
  isDemoMode = mod.isDemoMode;
});

describe('Settings', () => {
  it('returns default settings on first load', async () => {
    const settings = await loadSettings();
    expect(settings).toEqual({ demoMode: false });
  });

  it('loads saved settings from AsyncStorage', async () => {
    mockStorage['rhythm_settings'] = JSON.stringify({ demoMode: true });

    const settings = await loadSettings();
    expect(settings.demoMode).toBe(true);
  });

  it('saves settings to AsyncStorage', async () => {
    await saveSettings({ demoMode: true });
    expect(mockStorage['rhythm_settings']).toBe(JSON.stringify({ demoMode: true }));
  });

  it('isDemoMode returns false by default', async () => {
    expect(await isDemoMode()).toBe(false);
  });

  it('isDemoMode returns true after saving demoMode', async () => {
    await saveSettings({ demoMode: true });
    expect(await isDemoMode()).toBe(true);
  });

  it('handles corrupt storage data gracefully', async () => {
    mockStorage['rhythm_settings'] = 'not-json';

    const settings = await loadSettings();
    expect(settings).toEqual({ demoMode: false });
  });
});

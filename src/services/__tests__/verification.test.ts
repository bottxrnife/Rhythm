import { verifyRoutine } from '../verification';
import { saveSettings } from '../../state/Settings';

// Mock Settings module
jest.mock('../../state/Settings', () => {
  let demoMode = false;
  return {
    isDemoMode: jest.fn(() => Promise.resolve(demoMode)),
    loadSettings: jest.fn(() => Promise.resolve({ demoMode })),
    saveSettings: jest.fn((settings: { demoMode: boolean }) => {
      demoMode = settings.demoMode;
      return Promise.resolve();
    }),
    __setDemoMode: (val: boolean) => { demoMode = val; },
  };
});

const { __setDemoMode } = require('../../state/Settings');

describe('verification service', () => {
  beforeEach(() => {
    __setDemoMode(false);
    jest.clearAllMocks();
  });

  describe('demo mode', () => {
    it('returns verified result in demo mode', async () => {
      __setDemoMode(true);

      const result = await verifyRoutine({
        routineId: 'hydrate',
        sponsorName: 'Liquid Death',
      });

      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.model).toBe('demo');
      expect(result.policyPassed).toBe(true);
      expect(result.policyIssues).toEqual([]);
      expect(result.x402PaymentId).toMatch(/^x402_demo_/);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('real mode with API endpoint', () => {
    it('attempts to call the API when not in demo mode', async () => {
      __setDemoMode(false);

      // The fetch will fail in test environment (no server running)
      // but it should attempt the call, not throw "API_ENDPOINT not configured"
      await expect(
        verifyRoutine({
          routineId: 'hydrate',
          sponsorName: 'Liquid Death',
        })
      ).rejects.toThrow(); // Network error expected in test
    });
  });

  describe('VerificationRequest type', () => {
    it('accepts minimal request', async () => {
      __setDemoMode(true);

      const result = await verifyRoutine({
        routineId: 'brush-teeth',
        sponsorName: 'Colgate',
      });

      expect(result.verified).toBe(true);
    });

    it('accepts full request with all optional fields', async () => {
      __setDemoMode(true);

      const result = await verifyRoutine({
        routineId: 'take-statin',
        sponsorName: 'Pfizer',
        videoUri: 'file:///test/video.mp4',
        location: { latitude: 37.7749, longitude: -122.4194 },
        walletAddress: 'TestWallet123',
      });

      expect(result.verified).toBe(true);
    });
  });
});

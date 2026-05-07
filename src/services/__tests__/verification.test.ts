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

      // Force fetch to fail so the test is deterministic regardless of
      // whether the local backend happens to be running.
      const originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn(() => Promise.reject(new Error('Network request failed')));

      try {
        await expect(
          verifyRoutine({
            routineId: 'hydrate',
            sponsorName: 'Liquid Death',
          })
        ).rejects.toThrow(); // Expect network error
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    it('parses the server response into a VerificationResult with shortReason', async () => {
      __setDemoMode(false);

      const originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          verified: false,
          confidence: 0.4,
          reason: 'No cup visible on camera.',
          short_reason: 'could not detect cup',
          policy_passed: false,
          policy_issues: ['Sponsor product not visible'],
          agents: ['capture', 'verification', 'policy', 'payout'],
          bundle_hash: 'abc123',
          x402_payment_id: null,
        }),
      }));

      try {
        const result = await verifyRoutine({
          routineId: 'hydrate',
          sponsorName: 'Liquid Death',
        });

        expect(result.verified).toBe(false);
        expect(result.shortReason).toBe('could not detect cup');
        expect(result.policyPassed).toBe(false);
        expect(result.policyIssues).toContain('Sponsor product not visible');
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    it('falls back to a default shortReason when the server omits it', async () => {
      __setDemoMode(false);

      const originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          verified: false,
          confidence: 0.2,
          reason: 'Legacy response with no short_reason field',
          policy_passed: false,
          policy_issues: [],
          agents: [],
        }),
      }));

      try {
        const result = await verifyRoutine({
          routineId: 'hydrate',
          sponsorName: 'Liquid Death',
        });

        expect(result.shortReason).toBe('could not verify routine');
      } finally {
        (global as any).fetch = originalFetch;
      }
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

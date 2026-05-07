/**
 * Verification Service
 *
 * Sends the captured video to the verification server for AI analysis.
 * The server calls Amazon Nova 2 Lite to determine if the routine was completed.
 *
 * Pipeline:
 *   App (base64 video) → Local Server → Nova 2 Lite → Policy Check → Result
 *
 * Set API_ENDPOINT to your local server or deployed API Gateway URL.
 * Enable Demo Mode in Settings to skip real verification for testing.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { NativeModules, Platform } from 'react-native';
import { isDemoMode } from '../state/Settings';

// expo-constants is installed transitively via `expo` — use a lazy require so
// TypeScript doesn't error on missing types and so we fall back gracefully if
// the module isn't resolvable at runtime.
function getExpoHostUri(): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default ?? require('expo-constants');
    const hostUri =
      Constants?.expoConfig?.hostUri ??
      Constants?.manifest?.debuggerHost ??
      Constants?.manifest2?.extra?.expoClient?.hostUri;
    return typeof hostUri === 'string' ? hostUri : undefined;
  } catch {
    return undefined;
  }
}

// ── Verification API endpoint ──
// Local server: run `python3 backend/local_server.py` and use your Mac's IP
// AWS Lambda: use your API Gateway URL after deploying
function getVerificationEndpoint(): string {
  // Prefer explicit configuration (works in dev + prod builds)
  const explicitUrl = process.env.EXPO_PUBLIC_VERIFY_URL;
  if (explicitUrl) return explicitUrl;

  // In React Native dev, derive the host from the JS bundle URL.
  // Examples:
  // - "http://10.44.19.61:8081/index.bundle?platform=android&dev=true..."
  // - "http://localhost:8081/index.bundle?..."
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL === 'string' && scriptURL.startsWith('http')) {
    try {
      const hostname = new URL(scriptURL).hostname;
      if (hostname) return `http://${hostname}:3001/verify`;
    } catch {
      // ignore parse errors and fall through
    }
  }

  // In Expo dev, derive the LAN IP from the Metro host.
  const hostUri = getExpoHostUri();

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;

  // Fallbacks:
  // - Android emulator → host machine: 10.0.2.2
  // - Otherwise: 127.0.0.1 (web / same-machine testing)
  if (host) return `http://${host}:3001/verify`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001/verify';
  return 'http://127.0.0.1:3001/verify';
}

const API_ENDPOINT = getVerificationEndpoint();

const BEDROCK_MODEL_ID = 'us.amazon.nova-2-lite-v1:0';

export type VerificationRequest = {
  routineId: string;
  sponsorName: string;
  videoUri?: string;
  location?: { latitude: number; longitude: number };
  walletAddress?: string;
};

export type VerificationResult = {
  verified: boolean;
  confidence: number;
  reason: string;
  shortReason: string;
  model: string;
  processingTimeMs: number;
  x402PaymentId?: string;
  policyPassed: boolean;
  policyIssues: string[];
  agents: string[];
  bundleHash?: string;
};

export async function verifyRoutine(
  request: VerificationRequest,
): Promise<VerificationResult> {
  const startTime = Date.now();

  // Demo mode — skip real verification
  const demo = await isDemoMode();
  if (demo) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      verified: true,
      confidence: 0.95,
      reason: 'Demo mode — verification bypassed',
      shortReason: 'routine verified',
      model: 'demo',
      processingTimeMs: Date.now() - startTime,
      x402PaymentId: `x402_demo_${Date.now().toString(36)}`,
      policyPassed: true,
      policyIssues: [],
      agents: ['demo'],
      bundleHash: `demo_${Date.now().toString(36)}`,
    };
  }

  if (!API_ENDPOINT) {
    throw new Error(
      'API_ENDPOINT not configured. Set it in src/services/verification.ts or enable Demo Mode in Settings.',
    );
  }

  // Read the video file and encode as base64 using expo-file-system
  let video_b64: string | undefined;
  if (request.videoUri) {
    try {
      console.log('[Verification] Reading video:', request.videoUri);
      video_b64 = await FileSystem.readAsStringAsync(request.videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[Verification] Video encoded:', video_b64.length, 'base64 chars');
    } catch (e: any) {
      console.warn('[Verification] Could not read video file:', e?.message);
      // Try fallback with fetch for non-file URIs
      try {
        const response = await fetch(request.videoUri);
        const blob = await response.blob();
        video_b64 = await blobToBase64(blob);
        console.log('[Verification] Video encoded via fetch fallback:', video_b64?.length, 'base64 chars');
      } catch (e2: any) {
        console.warn('[Verification] Fetch fallback also failed:', e2?.message);
      }
    }
  } else {
    console.warn('[Verification] No videoUri provided');
  }

  console.log('[Verification] Sending to', API_ENDPOINT, '| video:', video_b64 ? `${video_b64.length} chars` : 'none');

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routine_id: request.routineId,
      sponsor: request.sponsorName,
      wallet: request.walletAddress,
      location: request.location
        ? `${request.location.latitude.toFixed(4)},${request.location.longitude.toFixed(4)}`
        : undefined,
      timestamp: Date.now(),
      video_b64,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('[Verification] API error:', response.status, errorText.slice(0, 200));
    throw new Error(`Verification API returned ${response.status}`);
  }

  const data = await response.json();

  console.log('[Verification] Result:', data.verified ? 'VERIFIED' : 'NOT VERIFIED', '| confidence:', data.confidence);

  return {
    verified: data.verified ?? false,
    confidence: data.confidence ?? 0,
    reason: data.reason ?? '',
    shortReason: data.short_reason ?? (data.verified ? 'routine verified' : 'could not verify routine'),
    model: data.model ?? BEDROCK_MODEL_ID,
    processingTimeMs: Date.now() - startTime,
    x402PaymentId: data.x402_payment_id,
    policyPassed: data.policy_passed ?? false,
    policyIssues: data.policy_issues ?? [],
    agents: data.agents ?? [],
    bundleHash: data.bundle_hash,
  };
}

/** Convert a Blob to base64 string */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (data:video/mp4;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

# AGENTS.md — Rhythm App

> Comprehensive codebase reference for AI agents and contributors.
> Last updated: May 2026

---

## What Rhythm Is

Rhythm is a mobile app that helps people with executive dysfunction (ADHD, autism, depression, TBI, dementia, chronic stress) complete everyday routines — hygiene, medication, pet care, cleaning, eating, self-care — by reducing friction, structuring next steps, verifying completion through short video captures, and providing small cryptocurrency rewards funded by sponsors.

The core loop:
1. **Capture** — User records a short video clip while performing a routine on Solana Seeker.
2. **Verify** — The clip is evaluated by Amazon Nova 2 Lite (multimodal AI) via AWS Bedrock.
3. **Reward** — If verified, a small credit reward is released through x402 payment rails.

**Status**: Idea-stage concept. The React Native UI layer is production-grade. The backend (Lambda + Bedrock) is templated but not deployed. On-chain recording exists but is untested on mainnet.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App Framework | React Native 0.81 (Expo 54) + TypeScript 5.9 |
| Navigation | React Navigation 7 (native-stack + custom swipe tabs) |
| State | React Context API + AsyncStorage |
| Wallet | Solana Mobile Wallet Adapter + @wallet-ui/react-native-web3js |
| Camera/Video | expo-camera, expo-video |
| Verification | AWS Lambda (Python 3.12) → Amazon Bedrock (Nova 2 Lite) |
| Storage | AWS S3 (video captures) |
| Payment | x402 (HTTP 402-based stablecoin micropayments) |
| Blockchain | Solana devnet (Memo Program for on-chain recording) |
| Identity | Solana Name Service (.skr domains via @onsol/tldparser-kit) |
| Crypto | @solana/web3.js 1.98, react-native-quick-crypto |
| Fonts | Plus Jakarta Sans (4 weights via @expo-google-fonts) |
| Haptics | expo-haptics |
| Location | expo-location |

---

## Project Structure

```
RhythmApp/
├── App.tsx                          # Entry point: fonts, providers, navigation container
├── index.js                         # Registers root component with polyfill
├── polyfill.js                      # react-native-quick-crypto install
├── app.json                         # Expo config (permissions, plugins, splash)
├── tsconfig.json                    # Extends expo/tsconfig.base, strict mode
├── package.json                     # Dependencies and scripts
│
├── src/
│   ├── components/                  # 8 reusable UI primitives
│   │   ├── BackHeader.tsx           # Detail screen back navigation with title
│   │   ├── Button.tsx               # Primary / Secondary / Ghost variants
│   │   ├── Card.tsx                 # Surface card with optional accent stripe
│   │   ├── Chip.tsx                 # Filter/category chip (active/inactive)
│   │   ├── ErrorBoundary.tsx        # Class-based error fallback UI
│   │   ├── InteractiveBarChart.tsx  # Scrubable bar chart with haptic feedback
│   │   ├── TopBar.tsx               # App header with avatar + settings icon
│   │   ├── VideoThumb.tsx           # Lazy video thumbnail with queue + cache
│   │   └── index.ts                 # Barrel export
│   │
│   ├── screens/                     # 14 screens
│   │   ├── WelcomeScreen.tsx        # Onboarding + Solana wallet sign-in (SIWS)
│   │   ├── HomeScreen.tsx           # Dashboard: greeting, daily goal progress, stats, next-best-action, favorites
│   │   ├── RoutinesScreen.tsx       # Search bar, category browser, featured routine, filter chips, favorites, completed-today indicators
│   │   ├── RoutineDetailScreen.tsx  # Hero image, steps, sponsor badge, verification hint, completed-today state
│   │   ├── CaptureScreen.tsx        # Camera viewfinder, recording, review, GPS capture
│   │   ├── VerifyingScreen.tsx      # 4-step agent pipeline progress UI
│   │   ├── VerifiedScreen.tsx       # Success + on-chain Memo Program recording
│   │   ├── AlmostScreen.tsx         # Partial match: retry or self-verify (no reward)
│   │   ├── RewardsScreen.tsx        # Balance, today/all-time stats, weekly chart, sponsor breakdown
│   │   ├── HistoryScreen.tsx        # Summary stats, daily activity chart, completion timeline
│   │   ├── CompletionDetailScreen.tsx # Video playback, metadata, on-chain link
│   │   ├── ProfileScreen.tsx        # Avatar, Seeker ID / .skr name, stats, wallet, sponsors
│   │   ├── SettingsScreen.tsx       # Daily goal stepper, notifications, quiet mode, reduced motion, thumbnails, demo mode, clear data
│   │   ├── SponsorsScreen.tsx       # Sponsor transparency, privacy card, featured sponsor
│   │   └── index.ts                 # Barrel export
│   │
│   ├── navigation/                  # React Navigation setup
│   │   ├── types.ts                 # RoutineData, CompletionData, RootStackParamList, TabParamList
│   │   ├── RootNavigator.tsx        # Root stack: Welcome → Main → detail/flow screens
│   │   ├── TabNavigator.tsx         # Custom swipe-based bottom tabs (no @react-navigation/bottom-tabs)
│   │   └── index.ts                 # Barrel export
│   │
│   ├── state/                       # Global state
│   │   ├── AppState.tsx             # Context provider: completions, credits, streak, favorites, daily goal, cooldown
│   │   └── Settings.ts             # AsyncStorage-backed settings (demoMode), cached
│   │
│   ├── services/                    # Backend integration
│   │   ├── verification.ts          # POST /verify API client + demo mode bypass
│   │   ├── wallet.ts                # Safe wallet hook (MWA on Seeker, fallback on standard Android)
│   │   └── skrIdentity.ts           # Solana Name Service .skr domain resolution
│   │
│   ├── theme/                       # Design system tokens
│   │   ├── colors.ts                # Material 3 palette (sage green primary, terracotta secondary)
│   │   ├── typography.ts            # Plus Jakarta Sans type scale (7 levels)
│   │   ├── spacing.ts              # 4px grid tokens
│   │   └── index.ts                 # Barrel + radii + shadows
│   │
│   ├── data/                        # Static data
│   │   └── routines.ts              # 14 routines, 6 categories, helper functions
│   │
│   └── utils/                       # Helpers
│       ├── time.ts                  # formatCompletionTime, isToday, getDayKey
│       ├── export.ts                # CSV export + completion summary statistics
│       └── streaks.ts               # Streak milestones, next milestone, progress
│
├── backend/
│   ├── lambda/
│   │   └── verify.py                # AWS Lambda: 4-agent pipeline (Capture → Verify → Policy → Payout)
│   ├── deploy.sh                    # One-command AWS deployment script
│   └── README.md                    # Architecture diagram, cost breakdown, deployment guide
│
└── assets/                          # App icons, splash screen images
    ├── icon.png
    ├── adaptive-icon.png
    ├── favicon.png
    └── splash-icon.png
```

---

## Navigation

### Root Stack (`RootNavigator.tsx`)

| Screen | Component | Animation | Notes |
|---|---|---|---|
| `Welcome` | WelcomeScreen | default | Initial route (if not onboarded). Solana wallet sign-in. Sets `hasOnboarded`. |
| `Main` | TabNavigator | default | Initial route (if onboarded). Params: `{ screen?: keyof TabParamList }` |
| `RoutineDetail` | RoutineDetailScreen | slide_from_right | Params: `{ routine: RoutineData }` |
| `Capture` | CaptureScreen | slide_from_bottom | Full-screen modal. Params: `{ routine }` |
| `Verifying` | VerifyingScreen | fade | Gesture disabled. Params: `{ routine, videoUri?, location? }` |
| `Verified` | VerifiedScreen | fade | Gesture disabled. Params: `{ routine, credits, videoUri?, location? }` |
| `Almost` | AlmostScreen | fade | Gesture disabled. Params: `{ routine, videoUri? }` |
| `CompletionDetail` | CompletionDetailScreen | slide_from_right | Params: `{ completion: CompletionData }` |
| `Sponsors` | SponsorsScreen | slide_from_right | No params |
| `Settings` | SettingsScreen | slide_from_right | No params |
| `Profile` | ProfileScreen | slide_from_right | No params |

### Tab Navigator (`TabNavigator.tsx`)

Custom implementation using `Animated` + `PanResponder` for swipe navigation between tabs. Does NOT use `@react-navigation/bottom-tabs` for the tab bar rendering — it's fully custom with haptic feedback.

| Tab | Screen | Icon |
|---|---|---|
| Home | HomeScreen | `home` |
| Routines | RoutinesScreen | `event-repeat` |
| Rewards | RewardsScreen | `payments` |
| History | HistoryScreen | `history` |

---

## Data Models

### RoutineData (`src/navigation/types.ts`)

```typescript
type RoutineData = {
  id: string;           // e.g. 'hydrate', 'brush-teeth'
  title: string;        // Display name
  description: string;  // One-line description
  icon: string;         // MaterialIcons name
  category: string;     // 'Hygiene' | 'Medication' | 'Pets' | 'Cleaning' | 'Eating' | 'Self-Care'
  credits: string;      // e.g. '+2.50'
  steps: string[];      // Ordered verification steps
  verifyHint: string;   // What the AI model checks for
  imageUri?: string;    // Hero image URL
  sponsored?: boolean;  // Whether a brand sponsors this routine
  sponsorName?: string; // e.g. 'Liquid Death', 'Colgate'
};
```

### CompletionData (`src/navigation/types.ts`)

```typescript
type CompletionData = {
  task: string;         // Routine title
  timestamp: number;    // Unix ms
  icon: string;         // MaterialIcons name
  credits: string;      // e.g. '+2.50' or '+0.00' for self-verified
  sponsor: string;      // Sponsor name or 'Rhythm'
  routineId: string;    // Matches RoutineData.id
  videoUri?: string;    // Local video file URI
  selfVerified?: boolean; // True if user self-verified (no AI, no reward)
  location?: { latitude: number; longitude: number };
  txSignature?: string; // Solana Memo Program transaction signature
};
```

---

## 14 Routines (6 Categories)

| ID | Title | Category | Credits | Sponsor |
|---|---|---|---|---|
| hydrate | Hydrate | Hygiene | +2.50 | Liquid Death |
| brush-teeth | Brush Teeth | Hygiene | +3.00 | Colgate |
| shower | Take a Shower | Hygiene | +3.00 | Dove |
| feed-cat | Feed Cat | Pets | +5.00 | Purina |
| wipe-counter | Wipe Counter | Cleaning | +2.00 | Clorox |
| laundry | Start Laundry | Cleaning | +3.50 | Tide |
| make-meal | Prepare a Meal | Eating | +4.00 | HelloFresh |
| tidy-space | Tidy Up | Self-Care | +2.50 | (none) |
| take-statin | Take Statin | Medication | +6.00 | Pfizer |
| take-metformin | Take Metformin | Medication | +6.00 | Bristol-Myers Squibb |
| take-bp-med | Take Blood Pressure Med | Medication | +6.00 | Merck |
| apply-topical | Apply Topical Treatment | Medication | +4.00 | AbbVie |
| use-inhaler | Use Inhaler | Medication | +5.00 | AstraZeneca |
| glucose-check | Check Blood Glucose | Medication | +4.00 | Abbott |

---

## State Management

### AppState Context (`src/state/AppState.tsx`)

Provider wraps the entire app. Persists to AsyncStorage under key `rhythm_app_state`.

**State shape:**
- `completions: CompletionData[]` — All-time completion history
- `hasOnboarded: boolean` — First-launch flag (used by RootNavigator to skip Welcome)
- `favoriteRoutineIds: string[]` — User's starred routine IDs
- `showVideoThumbnails: boolean` — Toggle for history video previews
- `dailyGoal: number` — Target routines per day (default 3, range 1-14)

**Derived values (computed in provider):**
- `totalCredits: number` — Sum of all credits
- `todayCompletions: CompletionData[]` — Filtered to today
- `todayCredits: number` — Sum of today's credits
- `streak: number` — Consecutive days with ≥1 completion (must include today or yesterday)
- `dailyProgress: number` — Fraction 0-1 of daily goal completed
- `todayRoutineIds: Set<string>` — Set of routine IDs completed today (for cooldown)
- `isLoading: boolean` — True during initial AsyncStorage load

**Actions:**
- `addCompletion(completion)` — Prepends to completions array, persists
- `setOnboarded()` — Sets hasOnboarded to true, persists
- `toggleFavoriteRoutine(routineId)` — Add/remove from favorites, persists
- `setShowVideoThumbnails(show)` — Toggle thumbnail display, persists
- `setDailyGoal(goal)` — Set daily routine target (clamped 1-14), persists
- `clearAllData()` — Resets all state to defaults, removes from AsyncStorage
- `isRoutineCompletedToday(routineId)` — Returns true if routine was completed today

### Settings (`src/state/Settings.ts`)

Separate AsyncStorage key `rhythm_settings`. Cached in memory after first load.

- `demoMode: boolean` — When true, verification service returns fake success (skips API call)

---

## Services

### Verification (`src/services/verification.ts`)

- `verifyRoutine(request: VerificationRequest): Promise<VerificationResult>`
- **Demo mode**: If `demoMode` is true, returns a fake verified result after 1.5s delay
- **Real mode**: POST to `API_ENDPOINT` with base64-encoded video, routine ID, sponsor, wallet, location
- `API_ENDPOINT` is currently empty string — must be set to deployed API Gateway URL

**VerificationResult fields:**
- `verified`, `confidence`, `reason`, `model`, `processingTimeMs`
- `x402PaymentId`, `policyPassed`, `policyIssues[]`, `agents[]`, `bundleHash`

### SKR Identity (`src/services/skrIdentity.ts`)

- `resolveSkrName(walletAddress): Promise<string | null>`
- Resolves Solana Name Service `.skr` domains for a wallet address
- Uses `@onsol/tldparser-kit` + `@solana/kit` (dynamic imports)
- 5-second timeout, in-memory cache
- Falls back to `null` if no domain found

---

## Backend (AWS Lambda)

**File**: `backend/lambda/verify.py`

4-agent pipeline:

1. **Capture Agent** — Validates input, generates bundle hash, stores video to S3
2. **Verification Agent** — Calls Amazon Bedrock Converse API with Nova 2 Lite
   - Multimodal input: video (S3 URI) + text prompt
   - Temperature 0, structured JSON output
   - Checks: product_visible, product_in_use, routine_completed, appears_genuine
3. **Policy Agent** — Enforces rules:
   - Confidence ≥ 0.70
   - Product must be visible and routine completed
   - Must appear genuine
   - Medication routines require location data
4. **Payout Agent** — Generates x402 payment ID if all checks pass

**Deployment**: `backend/deploy.sh` — One-command script that creates S3 bucket, IAM role, Lambda function, and API Gateway.

**Cost**: ~$0.003 per verification (mostly Nova 2 Lite inference).

---

## Theme / Design System

**Design language**: "Tactile Minimalism" — warm oatmeal surfaces, sage green primary, soft terracotta accents, diffuse ambient shadows, generous spacing.

### Colors (`src/theme/colors.ts`)

Key tokens:
- **Background**: `#fcf9f3` (warm oatmeal)
- **Primary**: `#465547` (sage green)
- **Secondary**: `#94492d` (terracotta)
- **Tertiary**: `#674c1a` (sand/gold — used for credits/rewards)
- **Error**: `#ba1a1a`
- Full Material 3 palette with surface containers, fixed colors, inverse colors

### Typography (`src/theme/typography.ts`)

Font: Plus Jakarta Sans (4 weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold)

| Token | Size | Weight | Use |
|---|---|---|---|
| display | 32px | 700 Bold | Hero headings |
| headlineLg | 24px | 600 SemiBold | Section headings |
| headlineMd | 20px | 600 SemiBold | Card headings |
| bodyLg | 18px | 400 Regular | Primary body text |
| bodyMd | 16px | 400 Regular | Secondary body text |
| labelLg | 14px | 600 SemiBold | Button labels, row titles |
| labelSm | 12px | 500 Medium | Captions, metadata |

### Spacing (`src/theme/spacing.ts`)

4px grid: `unit=4`, `stackSm=8`, `stackMd=16`, `stackLg=32`, `gutter=16`, `marginPage=24`, `touchTarget=48`

### Radii & Shadows (`src/theme/index.ts`)

- Radii: sm=4, md=8, lg=12, xl=16, xxl=24, full=9999
- Shadows: `diffuse` (ambient), `soft` (subtle), `button` (elevated)

---

## Components Reference

| Component | File | Purpose | Key Props |
|---|---|---|---|
| Button | Button.tsx | Action button | `label`, `onPress`, `variant` (primary/secondary/ghost), `icon`, `style` |
| Card | Card.tsx | Surface container | `children`, `accentColor?`, `style?`, `onPress?` |
| Chip | Chip.tsx | Filter/category toggle | `label`, `icon?`, `active?`, `onPress?` |
| TopBar | TopBar.tsx | App header | `title?`, `onAvatarPress?`, `onSettingsPress?` |
| BackHeader | BackHeader.tsx | Detail screen header | `title?` |
| InteractiveBarChart | InteractiveBarChart.tsx | Scrubable chart | `data[]`, `barColor`, `activeBarColor`, `formatDetail?`, `onScrubStart?`, `onScrubEnd?` |
| VideoThumb | VideoThumb.tsx | Lazy video thumbnail | `videoUri`, `size?` |
| ErrorBoundary | ErrorBoundary.tsx | Error fallback | `children` |

---

## Key User Flows

### 1. Onboarding
`WelcomeScreen` → Sign In with Solana (SIWS) → `Main` (Home tab)

### 2. Complete a Routine
`HomeScreen` (tap suggested routine) → `RoutineDetailScreen` (read steps) → `CaptureScreen` (record video) → `VerifyingScreen` (4-step pipeline) → `VerifiedScreen` (success + on-chain record) OR `AlmostScreen` (retry/self-verify)

### 3. Browse Routines
`RoutinesScreen` → Filter by category or favorites → Tap routine → `RoutineDetailScreen`

### 4. View Earnings
`RewardsScreen` → Total balance, weekly chart (scrubable), sponsor breakdown → Payout info

### 5. View History
`HistoryScreen` → Summary stats, daily activity chart, completion timeline → Tap item → `CompletionDetailScreen` (video playback + metadata)

### 6. Self-Verify (No Reward)
`AlmostScreen` → "Self-verify (no reward)" → Completion added with `selfVerified: true`, `credits: '+0.00'`

### 7. On-Chain Recording
`VerifiedScreen` → Automatically records a Solana Memo Program transaction with routine ID, sponsor, credits, timestamp, and location → Transaction signature stored in CompletionData

---

## Design Principles

- **Dignity over pity** — No patronizing language or infantilizing gamification
- **Low energy design** — Optimized for cognitive overload and executive dysfunction
- **One-handed use** — Thumb-first interactions, fast recovery after interruption
- **Anti-hustle aesthetic** — Warm, tactile, calm, quietly optimistic
- **Invisible tech** — Solana and AWS Nova happen behind the scenes; user sees "credits" and "verified"
- **Equal categories** — Every routine domain is visually and structurally equal

---

## Development Notes

### Running the App
```bash
npm install
npx expo start          # Expo Go or dev client
npx expo run:android    # Native Android build
npx expo run:ios        # Native iOS build
```

### Demo Mode
Toggle in Settings → Development → Demo Mode. Enabled by default. Skips real API verification and returns a fake success result. Useful for UI testing without a deployed backend. Disable it when you have a real backend deployed.

### Backend Deployment
```bash
cd backend
./deploy.sh YOUR_AWS_ACCOUNT_ID
```
Then set the returned API URL in `src/services/verification.ts`:
```typescript
const API_ENDPOINT = 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/verify';
```

### Key Dependencies
- `expo-camera` — Video recording (max 30s)
- `expo-video` — Video playback + thumbnail generation
- `expo-location` — GPS capture during recording
- `expo-haptics` — Haptic feedback on tab switches, favorites, chart scrubbing
- `@solana-mobile/mobile-wallet-adapter-protocol-web3js` — Wallet transactions
- `react-native-quick-crypto` — Crypto polyfill for Solana operations

### Conventions
- All screens are functional components with hooks
- Navigation uses typed params (`RootStackParamList`, `TabParamList`)
- Barrel exports from `index.ts` in each directory
- Theme tokens imported from `../theme` (never hardcoded colors/fonts)
- Haptic feedback on interactive elements (tab switches, favorites, chart scrubbing)
- All components use `accessibilityLabel` and `accessibilityRole` where appropriate

---

## Testing

### Setup
- **Framework**: Jest + React Native Testing Library
- **Config**: `jest.config.js` (react-native preset + babel-jest with babel-preset-expo)
- **Mocks**: `jest.setup.js` (AsyncStorage, expo-haptics, expo-camera, expo-video, wallet adapter, etc.)
- **Run**: `npm test` (single run), `npm run test:watch` (watch mode), `npm run test:coverage` (with coverage)

### Test Suites (96 tests across 8 suites)

| Suite | File | Tests | What it covers |
|---|---|---|---|
| Time utils | `src/utils/__tests__/time.test.ts` | 8 | `formatCompletionTime`, `isToday`, `getDayKey` |
| Routines data | `src/data/__tests__/routines.test.ts` | 11 | Data integrity, categories, helpers |
| Theme tokens | `src/theme/__tests__/theme.test.ts` | 8 | Colors, typography, spacing, radii, shadows |
| Verification | `src/services/__tests__/verification.test.ts` | 4 | Demo mode, API error, request types |
| AppState | `src/state/__tests__/AppState.test.tsx` | 18 | All state actions, derived values, daily goal, cooldown |
| Settings | `src/state/__tests__/Settings.test.ts` | 6 | Load, save, cache, demo mode, error handling |
| Export utils | `src/utils/__tests__/export.test.ts` | 12 | CSV export, summary statistics |
| Streak utils | `src/utils/__tests__/streaks.test.ts` | 14 | Milestones, next milestone, progress |

### Adding Tests
- Place test files in `__tests__/` directories next to the source
- Name files `*.test.ts` or `*.test.tsx`
- Use `renderHook` from `@testing-library/react-native` for hook tests
- Mock native modules in `jest.setup.js`

---

## Recent Features Added

### Routine Cooldown
- Each routine can only be completed once per day
- `RoutineDetailScreen` shows "Completed today" banner instead of "Start Recording" button
- `RoutinesScreen` shows green checkmark icon for completed routines
- `todayRoutineIds` Set and `isRoutineCompletedToday()` helper in AppState

### Daily Goal System
- Configurable daily routine target (1-14, default 3)
- Progress bar on HomeScreen showing completion toward daily goal
- "Goal reached!" celebration message when target is met
- Stepper control in Settings → Daily Goal section

### Routine Search
- Search bar on RoutinesScreen filters by title, description, category, and sponsor name
- Real-time filtering with clear button
- Empty state for no results

### Onboarding Flow
- `hasOnboarded` flag now controls initial route in RootNavigator
- First launch → WelcomeScreen; subsequent launches → Main (Home tab)
- `setOnboarded()` called on successful wallet sign-in
- Loading spinner shown during initial AsyncStorage hydration

### Data Management
- `clearAllData()` action resets all state and removes from AsyncStorage
- Settings → Data → "Clear All Data" with confirmation dialog
- Navigates back to Welcome screen after clearing

### Data Export Utilities
- `completionsToCSV()` — Formats completion history as CSV
- `completionsSummary()` — Generates statistics (totals, top routine, top sponsor)

### Streak Milestones
- `getStreakMilestone(streak)` — Returns celebration message at milestones (3, 7, 14, 21, 30, 60, 90, 100, 180, 365 days)
- `getNextMilestone(streak)` — Returns the next milestone to work toward
- `getMilestoneProgress(streak)` — Returns progress fraction toward next milestone

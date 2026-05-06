# Rhythm

**Agentic Verification and Incentive Infrastructure for Activities of Daily Living**

---

## The Problem

Executive dysfunction can turn ordinary daily routines into repeated points of failure. For people living with ADHD, autism spectrum disorder, depression, bipolar disorder, anxiety, traumatic brain injury, Alzheimer's disease, dementia, and chronic stress, tasks like brushing teeth, showering, taking medication, preparing food, doing laundry, cleaning, or caring for a pet are often not trivial habits but real barriers to health, dignity, and independence.

ADHD alone affects an estimated 6.0% of U.S. adults — about 15.5 million people — and executive function difficulties are documented across many other conditions as well.

Most existing tools are not designed for this problem. Reminder apps and habit trackers can encourage action, but they cannot verify whether the action actually occurred. Self-report is easy to fake, easy to forget, and too weak for sponsor funding or outcome-based incentives.

## What Rhythm Does

Rhythm is a consumer-facing mobile app that helps people start and finish everyday routines by reducing friction, lowering shame, structuring next steps, verifying completion through short capture sessions, and providing small cryptocurrency rewards — without making the experience feel childish, clinical, or transactional.

The system treats an activity of daily living as a job with evidence, evaluation, and payout conditions:

1. **Capture** — A user records a short clip while performing a task (brushing teeth, drinking water, feeding a pet, etc.) on Solana Seeker.
2. **Verify** — The clip is bundled with a sponsor-provided product image and a natural-language task prompt, then evaluated by AWS Nova 2 Lite as a multimodal verifier.
3. **Reward** — If the task appears completed, a small reward is released through an x402-based payment flow.

All routine categories — hygiene, grooming, meal preparation, cleaning, laundry, hydration, pet care, and self-care — are treated as equally important first-class experiences.

## Technical Stack

| Layer | Technology |
|---|---|
| Mobile Runtime | Solana Seeker (capture + wallet-native UX) |
| Verification | AWS Nova 2 Lite (multimodal: video + image + text) |
| Agent Framework | ERC-8004 (agent identity) + ERC-8183 (job escrow) |
| Payment Rail | x402 (HTTP 402-based stablecoin micropayments) |
| App Framework | React Native (Expo) + TypeScript |

## Sponsor Model

Rhythm's rewards are funded by two classes of sponsors:

- **Consumer brands** whose products already appear inside targeted routines (toothpaste, shampoo, detergent, pet food). They pay for verified product usage.
- **Institutional sponsors** — health plans, self-insured employers, pharmaceutical manufacturers, specialty pharmacies — who are financially exposed when routine adherence fails. They pay for risk reduction.

## Project Structure

```
RhythmApp/
├── App.tsx                        # Entry point, font loading, navigation container
├── src/
│   ├── theme/                     # Design system tokens
│   │   ├── colors.ts              # Full Material 3-style color palette
│   │   ├── typography.ts          # Plus Jakarta Sans type scale
│   │   ├── spacing.ts             # 4px grid spacing tokens
│   │   └── index.ts               # Barrel + radii, shadows
│   ├── components/                # Reusable UI primitives
│   │   ├── Button.tsx             # Primary / Secondary / Ghost variants
│   │   ├── Card.tsx               # Surface card with optional accent stripe
│   │   ├── Chip.tsx               # Filter/category chip
│   │   ├── CreditBadge.tsx        # Reward credit display
│   │   ├── Icon.tsx               # MaterialIcons wrapper
│   │   ├── ProgressBar.tsx        # Segmented daily momentum bar
│   │   ├── TopBar.tsx             # App header with avatar + title
│   │   ├── BackHeader.tsx         # Detail/flow screen back navigation
│   │   └── index.ts               # Barrel export
│   ├── screens/                   # All app screens
│   │   ├── WelcomeScreen.tsx      # Onboarding entry
│   │   ├── HomeScreen.tsx         # Dashboard with next-best-action
│   │   ├── RoutinesScreen.tsx     # Category browser + featured routines
│   │   ├── CaptureScreen.tsx      # Camera capture interface
│   │   ├── RewardsScreen.tsx      # Wallet balance + earnings history
│   │   ├── HistoryScreen.tsx      # Momentum chart + completion timeline
│   │   ├── RoutineDetailScreen.tsx # Task steps + verification info
│   │   ├── VerifiedScreen.tsx     # Success state + reward confirmation
│   │   ├── AlmostScreen.tsx       # Partial match / retry guidance
│   │   ├── SponsorsScreen.tsx     # Sponsor transparency + privacy info
│   │   └── index.ts               # Barrel export
│   └── navigation/                # React Navigation setup
│       ├── types.ts               # Stack + Tab param lists
│       ├── RootNavigator.tsx      # Root stack (Welcome → Main → flows)
│       ├── TabNavigator.tsx       # Bottom tab bar (5 tabs)
│       └── index.ts               # Barrel export
```

## Design Principles

- **Dignity over pity.** No patronizing language or infantilizing gamification.
- **Low energy design.** Optimized for cognitive overload, executive dysfunction, and chronic stress.
- **One-handed use.** Thumb-first mobile interactions, fast recovery after interruption.
- **Anti-hustle aesthetic.** Warm, tactile, calm, and quietly optimistic. No neon gradients, no crypto-bro energy, no hustle-productivity tropes.
- **Invisible tech.** Solana-powered rewards and AWS Nova AI verification happen behind the scenes. The user sees "credits" and "verified," not blockchain transactions and model confidence scores.
- **Equal categories.** Every routine domain — hygiene, pets, cleaning, eating, self-care — is visually and structurally equal. No single category dominates.

## Design System

The visual language is called **Tactile Minimalism** — warm oatmeal surfaces, sage green primary actions, soft terracotta accents, diffuse ambient shadows, and generous spacing. The sole typeface is **Plus Jakarta Sans** with an exaggerated weight hierarchy for effortless scanning.

Key tokens:
- Background: `#fcf9f3` (warm oatmeal)
- Primary: `#465547` (sage green)
- Secondary: `#94492d` (terracotta)
- Tertiary: `#674c1a` (sand/gold)
- Touch targets: 48px minimum
- Card radius: 16px
- Button height: 56px

## Getting Started

```bash
# Install dependencies
cd RhythmApp
npm install

# Start the Expo development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Status

This is an **idea-stage concept** — the design is production-grade, but the backend verification pipeline (AWS Nova 2 Lite), blockchain reward distribution (x402 + Solana), and agent orchestration (ERC-8004/8183) are not yet implemented. The React Native app represents the complete consumer-facing UI layer.

## License

Proprietary. All rights reserved.

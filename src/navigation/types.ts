export type RoutineData = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  credits: string;
  steps: string[];
  verifyHint: string;
  imageUri?: string;
  sponsored?: boolean;
  sponsorName?: string;
};

export type CompletionData = {
  task: string;
  timestamp: number;
  icon: string;
  credits: string;
  sponsor: string;
  routineId: string;
  videoUri?: string;
  selfVerified?: boolean;
  location?: { latitude: number; longitude: number };
  txSignature?: string;
};

export type RootStackParamList = {
  Welcome: undefined;
  Main: { screen?: keyof TabParamList } | undefined;
  RoutineDetail: { routine: RoutineData };
  Capture: { routine: RoutineData };
  Verifying: { routine: RoutineData; videoUri?: string; location?: { latitude: number; longitude: number } };
  Verified: { routine: RoutineData; credits: string; videoUri?: string; location?: { latitude: number; longitude: number } };
  Almost: { routine: RoutineData; videoUri?: string; shortReason?: string };
  CompletionDetail: { completion: CompletionData };
  Sponsors: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Routines: { category?: string } | undefined;
  Rewards: undefined;
  History: undefined;
};

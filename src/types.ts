export interface Place {
  lat: number;
  lon: number;
  label: string;
  type: "station" | "place" | "address";
  dbId?: string;
  bvgId?: string;
}

export interface JourneyLeg {
  mode?: string;
  walking?: boolean;
  departure: string;
  arrival: string;
  departureDelay?: number;
  arrivalDelay?: number;
  distance?: number;
  direction?: string;
  departurePlatform?: string;
  arrivalPlatform?: string;
  origin: { name: string; location?: { latitude: number; longitude: number } };
  destination: { name: string; location?: { latitude: number; longitude: number } };
  line?: {
    name?: string;
    product?: string;
    productName?: string;
  };
  remarks?: Remark[];
  polyline?: { type?: string; features?: unknown[] };
}

export interface Remark {
  type?: string;
  code?: string;
  summary?: string;
  text?: string;
}

export interface Journey {
  legs: JourneyLeg[];
  reliabilityScore?: number;
}

export interface RecentTrip {
  origin: string;
  destination: string;
  durationSeconds: number;
  timestamp: number;
  originPlace?: Place;
  destPlace?: Place;
}

export interface ShortcutPlace extends Place {
  role: "home" | "work";
}

export type Confidence = "high" | "medium" | "low";
export type WalkPace = "slow" | "normal" | "fast";
export type TransferRisk = "ok" | "tight" | "missed";

export interface TransferInsight {
  index: number;
  station: string;
  availableSeconds: number;
  walkSeconds: number;
  risk: TransferRisk;
  platformFrom?: string;
  platformTo?: string;
  platformChanged: boolean;
  message: string;
}

export interface JourneyInsights {
  transfers: TransferInsight[];
  overallTransferRisk: "low" | "medium" | "high";
  reliabilityScore: number;
  delayProbability: number;
  missedWarnings: string[];
  platformAlerts: string[];
  canMakeNow: boolean | null;
  makeConnectionHint: string | null;
}

export interface DisruptionSummary {
  messages: string[];
  humanMessages: string[];
  hasCancellation: boolean;
  hasMajorDelay: boolean;
  confidence: Confidence;
}

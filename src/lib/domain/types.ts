// Domain model. Kode memakai istilah teknis; label UI ada di status.ts.

export type LngLat = [number, number];

export interface Place {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  kind?: "station" | "landmark" | "mall" | "area" | "meeting";
}

export interface PriceTier {
  hours: number;
  price: number;
}

export interface StoreRules {
  weekendMeetingPointOnly: boolean;
  dpPerUnit: number;
  lateFeePerHour: number;
  graceMinutes: number;
  freeDeliveryKm: number;
  maxDeliveryKm: number;
  deliveryFee: number;
  deposit: string[];
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  address: string;
  base: Place;
  meetingPoint: Place & { directions: string };
  openHours: string;
  ownerName: string;
  ownerPhone: string;
  crew: string[];
  rules: StoreRules;
  qrisImage?: string;
  isPartnerSince: string;
  primary?: boolean;
}

export type VehicleKind = "matic" | "maxi" | "retro" | "sport";

export interface ServiceItemState {
  key: "oil" | "gear" | "cvt";
  label: string;
  intervalKm: number;
  lastKm: number;
}

export interface Vehicle {
  id: string;
  storeId: string;
  model: string;
  shortModel: string;
  kind: VehicleKind;
  cc: number;
  year: number;
  color: string;
  colorName: string;
  plate: string;
  odometer: number;
  fuel: number; // 0..5 bar
  tiers: PriceTier[];
  service: ServiceItemState[];
  avgKmPerDay: number;
  maintenance?: { since: number; until?: number; reason: string; scheduled?: boolean } | null;
  inspection?: boolean;
  serviceLog: ServiceRecord[];
}

export interface ServiceRecord {
  id: string;
  at: number;
  km: number;
  items: { name: string; cost: number }[];
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  nik?: string;
  address?: string;
  simNumber?: string;
  instagram?: string;
  verified: boolean;
  faceMatch?: number;
  selfie?: string; // small data URL
  rentals: number;
  since: number;
}

export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "active"
  | "completed";

export interface Destination {
  key: string;
  label: string;
  outside: boolean;
  permits: string[];
}

export interface Handover {
  at: number;
  km: number;
  fuel: number;
  deposits: string[];
  photos: number;
  signed: boolean;
  by: string;
}

export interface ReturnInfo {
  at: number;
  km: number;
  fuel: number;
  lateMinutes: number;
  lateFee: number;
  damageFee: number;
  damageNote?: string;
  fuelFee: number;
}

export interface Payment {
  mode: "dp" | "full";
  amount: number;
  proof?: string;
  paidAt?: number;
  confirmed?: boolean;
}

export interface Extension {
  hours: number;
  price: number;
  status: "pending" | "approved" | "rejected";
  at: number;
}

export interface Position {
  lat: number;
  lng: number;
  acc: number;
  t: number;
  src: "phone" | "sim";
}

export interface TimelineEntry {
  t: number;
  text: string;
  tone?: "ok" | "warn" | "danger" | "info";
}

export interface Booking {
  id: string;
  code: string;
  storeId: string;
  vehicleId: string;
  customerId: string;
  start: number;
  end: number;
  pickup: { mode: "meet" | "deliver"; place: Place };
  dropoff: { mode: "meet" | "deliver"; place: Place };
  destination: Destination;
  price: { base: number; delivery: number; total: number; tierLabel: string };
  payment: Payment;
  status: BookingStatus;
  createdAt: number;
  approvedAt?: number;
  permits: string[];
  crew?: string;
  arrival?: { at: number; note: string; lat: number; lng: number };
  handover?: Handover;
  returned?: ReturnInfo;
  extension?: Extension;
  rejectReason?: string;
  positions: Position[];
  zoneState: Record<string, boolean>;
  timeline: TimelineEntry[];
  source: "app" | "whatsapp" | "walkin";
  ambient?: { path: LngLat[]; periodMin: number; offset: number };
}

export type ZoneKind = "service" | "restricted" | "monitor";

export interface Zone {
  id: string;
  name: string;
  kind: ZoneKind;
  scope: "platform" | "store";
  storeId?: string;
  note: string;
  polygon: LngLat[]; // ring, closed
  active: boolean;
  createdAt: number;
}

export type AlertType = "exit_area" | "enter_zone" | "signal_lost" | "overdue";

export interface Alert {
  id: string;
  bookingId: string;
  type: AlertType;
  zoneId?: string;
  at: number;
  lat?: number;
  lng?: number;
  acc?: number;
  derived?: boolean;
}

export interface AlertState {
  status: "new" | "acknowledged" | "resolved";
  at: number;
  note?: string;
}

export interface SimState {
  bookingId?: string;
  routeId?: string;
  running: boolean;
  progress: number; // 0..1
  speed: number; // route fraction per minute
  runner?: string;
  signalOff: Record<string, boolean>;
}

export interface World {
  id: string;
  epoch: number;
  rev: number;
  t0: number;
  clockOffset: number;
  stores: Store[];
  vehicles: Vehicle[];
  customers: Customer[];
  bookings: Booking[];
  zones: Zone[];
  alerts: Alert[];
  alertState: Record<string, AlertState>;
  sim: SimState;
  seen: string[];
  config: { signalLostAfterSec: number };
}

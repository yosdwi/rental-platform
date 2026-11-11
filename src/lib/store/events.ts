import type {
  AlertState, Booking, Customer, Handover, Position, ReturnInfo, ServiceRecord, SimState, Store, Vehicle, Zone,
} from "../domain/types";

export type WorldEvent =
  | { type: "world.reset"; t0: number; newEpoch: number; worldId: string }
  | { type: "customer.upsert"; customer: Customer }
  | { type: "store.update"; storeId: string; patch: Partial<Store> }
  | { type: "booking.create"; booking: Booking }
  | { type: "booking.pay"; id: string; mode: "dp" | "full"; amount: number; proof?: string; at: number }
  | { type: "booking.confirmPayment"; id: string; at: number }
  | { type: "booking.approve"; id: string; at: number; permits: string[]; crew?: string }
  | { type: "booking.reject"; id: string; reason: string; at: number }
  | { type: "booking.cancel"; id: string; at: number }
  | { type: "booking.crew"; id: string; crew: string; at: number }
  | { type: "booking.arrive"; id: string; at: number; note: string; lat: number; lng: number }
  | { type: "booking.start"; id: string; handover: Handover }
  | { type: "booking.extendRequest"; id: string; hours: number; price: number; at: number }
  | { type: "booking.extendDecide"; id: string; approve: boolean; at: number }
  | { type: "booking.complete"; id: string; ret: ReturnInfo; serviceReason?: string }
  | { type: "booking.permit"; id: string; zoneIds: string[]; at: number }
  | { type: "loc"; bookingId: string; pos: Position }
  | { type: "alert.state"; alertId: string; state: AlertState }
  | { type: "zone.upsert"; zone: Zone }
  | { type: "zone.remove"; id: string }
  | { type: "vehicle.upsert"; vehicle: Vehicle }
  | { type: "vehicle.inspected"; id: string }
  | { type: "vehicle.maintenance"; id: string; maintenance: Vehicle["maintenance"] }
  | { type: "vehicle.serviceDone"; id: string; record: ServiceRecord; keys: string[] }
  | { type: "sim"; patch: Partial<SimState> }
  | { type: "clock"; offset: number };

export interface Envelope {
  id: string;
  epoch: number;
  t: number;
  origin: string;
  ev: WorldEvent;
}

export type SyncMessage =
  | { kind: "ev"; env: Envelope }
  | { kind: "hello"; from: string; worldId: string; epoch: number; rev: number }
  | { kind: "snap"; from: string; world: import("../domain/types").World }
  | { kind: "media"; key: string; data: string };

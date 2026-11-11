// Data awal (fixture) untuk simulasi: GSM Bogor + rental fiktif di sekitarnya.
// Semua orang, nomor, dan NIK di file ini fiktif. Waktu dihitung relatif ke t0.

import type {
  Booking, Customer, Destination, LngLat, Place, PriceTier, Store, Vehicle, VehicleKind, World, Zone,
} from "./types";

const H = 3_600_000;
const M = 60_000;

export const PLACES: Place[] = [
  { id: "stasiun-bogor", name: "Stasiun Bogor", area: "Bogor Tengah", lat: -6.5951, lng: 106.7907, kind: "station" },
  { id: "taman-topi", name: "KFC Taman Topi", area: "Seberang Stasiun Bogor", lat: -6.5961, lng: 106.7932, kind: "meeting" },
  { id: "surya-kencana", name: "Surya Kencana", area: "Bogor Tengah", lat: -6.6037, lng: 106.7995, kind: "area" },
  { id: "kebun-raya", name: "Kebun Raya Bogor", area: "Bogor Tengah", lat: -6.5977, lng: 106.7995, kind: "landmark" },
  { id: "botani", name: "Botani Square", area: "Bogor Timur", lat: -6.6016, lng: 106.8072, kind: "mall" },
  { id: "baranangsiang", name: "Terminal Baranangsiang", area: "Bogor Timur", lat: -6.6058, lng: 106.8072, kind: "station" },
  { id: "tajur", name: "Tajur", area: "Bogor Timur", lat: -6.6262, lng: 106.8188, kind: "area" },
  { id: "ipb", name: "IPB Dramaga", area: "Kab. Bogor", lat: -6.5575, lng: 106.7258, kind: "landmark" },
  { id: "sentul-aeon", name: "AEON Mall Sentul City", area: "Sentul", lat: -6.5446, lng: 106.8502, kind: "mall" },
  { id: "taman-budaya", name: "Taman Budaya Sentul", area: "Sentul", lat: -6.5672, lng: 106.8626, kind: "landmark" },
  { id: "ciawi", name: "Ciawi", area: "Kab. Bogor", lat: -6.6505, lng: 106.844, kind: "area" },
  { id: "puncak", name: "Puncak, Cisarua", area: "Kab. Bogor", lat: -6.699, lng: 106.948, kind: "area" },
  { id: "gambir", name: "Stasiun Gambir", area: "Jakarta Pusat", lat: -6.1767, lng: 106.8306, kind: "station" },
  { id: "manggarai", name: "Stasiun Manggarai", area: "Jakarta Selatan", lat: -6.21, lng: 106.8501, kind: "station" },
];

export const placeById = (id: string) => PLACES.find((p) => p.id === id)!;

export const DESTINATIONS: Destination[] = [
  { key: "kota", label: "Dalam kota", outside: false, permits: [] },
  { key: "sentul", label: "Sentul", outside: false, permits: [] },
  { key: "puncak", label: "Puncak", outside: true, permits: ["z-service-gsm", "z-puncak"] },
  { key: "luar", label: "Luar kota", outside: true, permits: ["z-service-gsm"] },
];

// Rute simulasi (lng, lat), kira-kira mengikuti jalan.
export const ROUTES: Record<string, { name: string; path: LngLat[] }> = {
  puncak: {
    name: "Taman Topi → Puncak",
    path: [
      [106.7932, -6.5961], [106.7944, -6.5988], [106.7962, -6.6043], [106.8001, -6.6061],
      [106.8045, -6.6104], [106.8100, -6.6174], [106.8186, -6.6268], [106.8270, -6.6342],
      [106.8360, -6.6430], [106.8440, -6.6505], [106.8490, -6.6555], [106.8560, -6.6590],
      [106.8620, -6.6620], [106.8710, -6.6660], [106.8800, -6.6700], [106.8900, -6.6745],
      [106.9000, -6.6780], [106.9100, -6.6805], [106.9200, -6.6830], [106.9310, -6.6865],
      [106.9400, -6.6900], [106.9480, -6.6990],
    ],
  },
  kota: {
    name: "Keliling kota",
    path: [
      [106.7932, -6.5961], [106.7990, -6.5945], [106.8045, -6.5990], [106.8072, -6.6016],
      [106.8072, -6.6058], [106.8030, -6.6050], [106.7995, -6.6037], [106.7962, -6.6043],
      [106.7944, -6.5988], [106.7932, -6.5961],
    ],
  },
  sentul: {
    name: "Taman Topi → Sentul",
    path: [
      [106.7932, -6.5961], [106.8000, -6.5935], [106.8072, -6.6000], [106.8150, -6.5900],
      [106.8250, -6.5780], [106.8330, -6.5650], [106.8400, -6.5540], [106.8502, -6.5446],
      [106.8580, -6.5530], [106.8626, -6.5672],
    ],
  },
};

const ring = (pts: LngLat[]): LngLat[] => [...pts, pts[0]];
const box = (lng: number, lat: number, d: number): LngLat[] =>
  ring([[lng - d, lat - d], [lng + d, lat - d], [lng + d, lat + d], [lng - d, lat + d]]);

export const ZONE_PRESETS: { id: string; name: string; area: string; polygon: LngLat[]; center: [number, number] }[] = [
  {
    id: "puncak", name: "Puncak – Cisarua", area: "Kab. Bogor", center: [106.95, -6.7],
    polygon: ring([[106.89, -6.665], [106.96, -6.66], [107.02, -6.69], [107.01, -6.745], [106.94, -6.75], [106.895, -6.715]]),
  },
  {
    id: "sukabumi", name: "Sukabumi", area: "Jawa Barat", center: [106.93, -6.92],
    polygon: ring([[106.86, -6.86], [107.0, -6.86], [107.0, -6.98], [106.86, -6.98]]),
  },
  {
    id: "jakarta", name: "DKI Jakarta", area: "Jakarta", center: [106.83, -6.2],
    polygon: ring([[106.69, -6.09], [106.97, -6.09], [106.97, -6.37], [106.69, -6.37]]),
  },
  {
    id: "bandung", name: "Kota Bandung", area: "Jawa Barat", center: [107.61, -6.91],
    polygon: ring([[107.54, -6.85], [107.7, -6.85], [107.7, -6.97], [107.54, -6.97]]),
  },
];

function tiers(p12: number, p24: number, p36: number, p48: number): PriceTier[] {
  return [
    { hours: 12, price: p12 * 1000 },
    { hours: 24, price: p24 * 1000 },
    { hours: 36, price: p36 * 1000 },
    { hours: 48, price: p48 * 1000 },
  ];
}

const MODELS: Record<string, { model: string; short: string; kind: VehicleKind; cc: number; t: PriceTier[] }> = {
  vario125: { model: "Honda Vario 125", short: "Vario 125", kind: "matic", cc: 125, t: tiers(100, 140, 200, 260) },
  vario160: { model: "Honda Vario 160", short: "Vario 160", kind: "matic", cc: 160, t: tiers(115, 165, 235, 310) },
  beat: { model: "Honda BeAT", short: "BeAT", kind: "matic", cc: 110, t: tiers(75, 110, 160, 210) },
  scoopy: { model: "Honda Scoopy", short: "Scoopy", kind: "retro", cc: 110, t: tiers(90, 125, 180, 240) },
  fazzio: { model: "Yamaha Fazzio", short: "Fazzio", kind: "retro", cc: 125, t: tiers(90, 130, 185, 250) },
  nmax: { model: "Yamaha NMAX 155", short: "NMAX", kind: "maxi", cc: 155, t: tiers(160, 230, 330, 440) },
  pcx: { model: "Honda PCX 160", short: "PCX 160", kind: "maxi", cc: 160, t: tiers(170, 250, 360, 480) },
  aerox: { model: "Yamaha Aerox 155", short: "Aerox", kind: "sport", cc: 155, t: tiers(150, 220, 315, 420) },
};

export const MODEL_OPTIONS = Object.entries(MODELS).map(([key, m]) => ({ key, ...m }));

function vehicle(
  id: string, storeId: string, modelKey: string, plate: string, colorName: string, color: string,
  year: number, odometer: number, oilUsed: number, gearUsed: number, avgKmPerDay: number,
): Vehicle {
  const m = MODELS[modelKey];
  return {
    id, storeId, model: m.model, shortModel: m.short, kind: m.kind, cc: m.cc, year, color, colorName, plate,
    odometer, fuel: 4, tiers: m.t.map((x) => ({ ...x })), avgKmPerDay, maintenance: null, serviceLog: [],
    service: [
      { key: "oil", label: "Oli mesin", intervalKm: 2000, lastKm: odometer - oilUsed },
      { key: "gear", label: "Oli gardan", intervalKm: 8000, lastKm: odometer - gearUsed },
      { key: "cvt", label: "Servis CVT", intervalKm: 8000, lastKm: odometer - gearUsed },
    ],
  };
}

const rules = (o: Partial<Store["rules"]> = {}): Store["rules"] => ({
  weekendMeetingPointOnly: false, dpPerUnit: 50_000, lateFeePerHour: 15_000, graceMinutes: 15,
  freeDeliveryKm: 5, maxDeliveryKm: 12, deliveryFee: 20_000, deposit: ["KTP asli"], ...o,
});

function makeStores(t0: number): Store[] {
  const tp = placeById("taman-topi");
  return [
    {
      id: "gsm", slug: "gsm-bogor", name: "G'Ndut Sewa Motor", shortName: "GSM Bogor", city: "Bogor",
      address: "Bogor Tengah, Kota Bogor", openHours: "07.00 – 21.00",
      base: { id: "gsm-base", name: "Garasi GSM", area: "Bogor Tengah", lat: -6.5968, lng: 106.7915 },
      meetingPoint: {
        ...tp,
        directions: "Keluar Stasiun Bogor lewat pintu timur (arah Alun-alun), belok kanan ±100 m, lalu menyeberang ke KFC Taman Topi.",
      },
      ownerName: "Pemilik GSM", ownerPhone: "", crew: ["Andi", "Raka"],
      rules: rules({ weekendMeetingPointOnly: true, dpPerUnit: 40_000, freeDeliveryKm: 3, deposit: ["KTP asli", "Dokumen pendukung asli"] }),
      isPartnerSince: "Nov 2026", primary: true,
    },
    {
      id: "kujang", slug: "kujang-rent", name: "Kujang Rent", shortName: "Kujang Rent", city: "Bogor",
      address: "Tajur, Bogor Timur", openHours: "06.00 – 22.00",
      base: { id: "kujang-base", name: "Kujang Rent", area: "Tajur", lat: -6.6185, lng: 106.8125 },
      meetingPoint: { id: "kujang-mp", name: "Garasi Kujang Rent", area: "Tajur", lat: -6.6185, lng: 106.8125, kind: "meeting", directions: "Garasi di pinggir jalan raya Tajur." },
      ownerName: "Kujang", ownerPhone: "", crew: [], rules: rules({ freeDeliveryKm: 5 }), isPartnerSince: "Nov 2026",
    },
    {
      id: "sentul", slug: "sentul-ride", name: "Sentul Ride", shortName: "Sentul Ride", city: "Bogor",
      address: "Sentul City, Babakan Madang", openHours: "08.00 – 20.00",
      base: { id: "sentul-base", name: "Sentul Ride", area: "Sentul", lat: -6.56, lng: 106.848 },
      meetingPoint: { id: "sentul-mp", name: "Lobby AEON Sentul", area: "Sentul", lat: -6.5446, lng: 106.8502, kind: "meeting", directions: "Lobby utama AEON Mall." },
      ownerName: "Sentul", ownerPhone: "", crew: [], rules: rules({ freeDeliveryKm: 4, maxDeliveryKm: 15 }), isPartnerSince: "Nov 2026",
    },
    {
      id: "dramaga", slug: "dramaga-motor", name: "Dramaga Motor", shortName: "Dramaga Motor", city: "Bogor",
      address: "Dramaga, Kab. Bogor", openHours: "07.00 – 21.00",
      base: { id: "dramaga-base", name: "Dramaga Motor", area: "Dramaga", lat: -6.559, lng: 106.73 },
      meetingPoint: { id: "dramaga-mp", name: "Gerbang IPB Dramaga", area: "Dramaga", lat: -6.5575, lng: 106.7258, kind: "meeting", directions: "Depan gerbang utama IPB." },
      ownerName: "Dramaga", ownerPhone: "", crew: [], rules: rules({ dpPerUnit: 30_000 }), isPartnerSince: "Nov 2026",
    },
  ].map((s) => ({ ...s, createdAt: t0 })) as Store[];
}

function makeVehicles(): Vehicle[] {
  return [
    // GSM Bogor — 10 unit. v1 = unit utama demo (oli hampir jatuh tempo).
    vehicle("v1", "gsm", "vario125", "F 4521 KT", "Hitam", "#1d1f27", 2023, 18420, 1985, 6100, 42),
    vehicle("v2", "gsm", "vario125", "F 3187 KR", "Merah", "#b8322a", 2022, 24310, 820, 3400, 38),
    vehicle("v3", "gsm", "beat", "F 6610 KS", "Putih", "#eceef3", 2024, 9120, 640, 1200, 35),
    vehicle("v4", "gsm", "beat", "F 2204 KT", "Hitam", "#22252e", 2023, 15880, 1100, 5200, 33),
    vehicle("v5", "gsm", "scoopy", "F 5719 KR", "Krem", "#e7d8bd", 2023, 12040, 1460, 4300, 30),
    vehicle("v6", "gsm", "nmax", "F 8832 KS", "Abu", "#6f7380", 2023, 21500, 1210, 7100, 55),
    vehicle("v7", "gsm", "pcx", "F 1408 KT", "Putih", "#f1f2f5", 2024, 8760, 480, 2400, 48),
    vehicle("v8", "gsm", "fazzio", "F 7093 KS", "Mint", "#a9dcc8", 2024, 6330, 1010, 1900, 28),
    vehicle("v9", "gsm", "vario160", "F 4410 KR", "Biru", "#2e4fa8", 2024, 7420, 380, 2100, 40),
    vehicle("v10", "gsm", "aerox", "F 9126 KS", "Biru tua", "#1f3360", 2023, 16900, 1520, 6600, 46),
    // Rental lain (fiktif)
    vehicle("k1", "kujang", "beat", "F 3321 RA", "Merah", "#c23b30", 2023, 14000, 900, 3000, 30),
    vehicle("k2", "kujang", "vario125", "F 8820 RA", "Putih", "#eef0f4", 2022, 22000, 400, 2000, 30),
    vehicle("k3", "kujang", "nmax", "F 1190 RB", "Hitam", "#1c1e25", 2023, 18000, 1200, 5000, 30),
    vehicle("s1", "sentul", "pcx", "F 7781 SN", "Hitam", "#202229", 2024, 9000, 600, 3000, 30),
    vehicle("s2", "sentul", "scoopy", "F 2290 SN", "Biru muda", "#a8c8e8", 2023, 11000, 700, 2000, 30),
    vehicle("s3", "sentul", "fazzio", "F 6602 SN", "Krem", "#e9dcc4", 2024, 5000, 300, 1000, 30),
    vehicle("d1", "dramaga", "beat", "F 4471 DR", "Hitam", "#202229", 2022, 26000, 1100, 6000, 30),
    vehicle("d2", "dramaga", "beat", "F 5582 DR", "Putih", "#eceef3", 2023, 17000, 500, 2000, 30),
    vehicle("d3", "dramaga", "scoopy", "F 1203 DR", "Merah", "#c23b30", 2022, 21000, 1600, 7000, 30),
  ];
}

function makeCustomers(t0: number): Customer[] {
  const c = (id: string, name: string, phone: string, rentals: number, ig: string): Customer => ({
    id, name, phone, verified: true, faceMatch: 96 + (rentals % 3), rentals, since: t0 - 120 * 24 * H, instagram: ig,
    nik: "3271" + phone.slice(-12).padStart(12, "0"),
  });
  return [
    c("c-rina", "Rina Maharani", "081210004411", 4, "@rinamhr"),
    c("c-fajar", "Fajar Nugroho", "081310007723", 1, "@fajarngr"),
    c("c-wulan", "Wulan Sari", "085710001290", 2, "@wulansari"),
    c("c-salsa", "Salsabila Putri", "081910003375", 3, "@salsaptr"),
    c("c-bagas", "Bagas Aditya", "082110006614", 0, "@bagasadt"),
    c("c-hendra", "Hendra Wijaya", "081110009052", 6, "@hendraw"),
    c("c-tiara", "Tiara Anjani", "085610004038", 2, "@tiaraanj"),
  ];
}

const roundUp = (t: number, step: number) => Math.ceil(t / step) * step;

function tomorrowAt(t0: number, hour: number) {
  const d = new Date(t0);
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function booking(p: Partial<Booking> & Pick<Booking, "id" | "vehicleId" | "customerId" | "start" | "end" | "status">): Booking {
  const tp = placeById("taman-topi");
  return {
    code: "GSM-" + p.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-6),
    storeId: "gsm",
    pickup: { mode: "meet", place: tp },
    dropoff: { mode: "meet", place: tp },
    destination: DESTINATIONS[0],
    price: { base: 140_000, delivery: 0, total: 140_000, tierLabel: "24 jam" },
    payment: { mode: "full", amount: 140_000, paidAt: p.start - 6 * H, confirmed: true },
    createdAt: p.start - 26 * H,
    permits: [],
    positions: [],
    zoneState: {},
    timeline: [],
    source: "app",
    ...p,
  };
}

function makeBookings(t0: number): Booking[] {
  const scoopyStart = roundUp(t0 + 2 * H, 30 * M);
  const bagasStart = tomorrowAt(t0, 8);
  return [
    booking({
      id: "bk-rina", vehicleId: "v2", customerId: "c-rina", start: t0 - 5 * H, end: t0 + 19 * H, status: "active",
      approvedAt: t0 - 30 * H, crew: "Andi",
      handover: { at: t0 - 5 * H, km: 24310, fuel: 4, deposits: ["KTP asli", "KTM"], photos: 4, signed: true, by: "Andi" },
      ambient: { path: [[106.7935, -6.596], [106.799, -6.5945], [106.8045, -6.599], [106.803, -6.605], [106.7965, -6.604], [106.7935, -6.596]], periodMin: 38, offset: 0.2 },
      timeline: [{ t: t0 - 5 * H, text: "Motor diserahkan oleh Andi", tone: "ok" }],
    }),
    booking({
      id: "bk-fajar", vehicleId: "v6", customerId: "c-fajar", start: t0 - 20 * H, end: t0 + 16 * H, status: "active",
      destination: DESTINATIONS[1], price: { base: 330_000, delivery: 0, total: 330_000, tierLabel: "36 jam" },
      payment: { mode: "full", amount: 330_000, paidAt: t0 - 21 * H, confirmed: true },
      handover: { at: t0 - 20 * H, km: 21500, fuel: 5, deposits: ["KTP asli", "NPWP"], photos: 4, signed: true, by: "Raka" },
      ambient: { path: [[106.845, -6.548], [106.858, -6.552], [106.866, -6.566], [106.852, -6.57], [106.845, -6.56], [106.845, -6.548]], periodMin: 50, offset: 0.6 },
      timeline: [{ t: t0 - 20 * H, text: "Motor diserahkan oleh Raka", tone: "ok" }],
    }),
    booking({
      id: "bk-wulan", vehicleId: "v7", customerId: "c-wulan", start: t0 - 23 * H - 20 * M, end: t0 + 40 * M, status: "active",
      price: { base: 250_000, delivery: 0, total: 250_000, tierLabel: "24 jam" },
      payment: { mode: "full", amount: 250_000, paidAt: t0 - 24 * H, confirmed: true },
      handover: { at: t0 - 23 * H - 20 * M, km: 8760, fuel: 4, deposits: ["KTP asli", "SIM A"], photos: 4, signed: true, by: "Andi" },
      ambient: { path: [[106.8072, -6.6016], [106.812, -6.608], [106.8188, -6.6262], [106.812, -6.612], [106.8072, -6.6016]], periodMin: 44, offset: 0.1 },
      timeline: [{ t: t0 - 23 * H - 20 * M, text: "Motor diserahkan oleh Andi", tone: "ok" }],
    }),
    booking({
      id: "bk-salsa", vehicleId: "v5", customerId: "c-salsa", start: scoopyStart, end: scoopyStart + 24 * H, status: "approved",
      approvedAt: t0 - 3 * H, crew: "Raka", destination: DESTINATIONS[1],
      price: { base: 125_000, delivery: 0, total: 125_000, tierLabel: "24 jam" },
      payment: { mode: "dp", amount: 40_000, paidAt: t0 - 3 * H, confirmed: true },
      createdAt: t0 - 4 * H,
    }),
    booking({
      id: "bk-bagas", vehicleId: "v9", customerId: "c-bagas", start: bagasStart, end: bagasStart + 12 * H, status: "pending",
      price: { base: 115_000, delivery: 0, total: 115_000, tierLabel: "12 jam" },
      payment: { mode: "dp", amount: 40_000, paidAt: t0 - 12 * M },
      createdAt: t0 - 14 * M,
    }),
    booking({
      id: "bk-tiara", vehicleId: "v8", customerId: "c-tiara", start: t0 - 25 * H, end: t0 - 1 * H, status: "completed",
      price: { base: 130_000, delivery: 0, total: 130_000, tierLabel: "24 jam" },
      handover: { at: t0 - 25 * H, km: 6250, fuel: 4, deposits: ["KTP asli"], photos: 4, signed: true, by: "Raka" },
      returned: { at: t0 - 50 * M, km: 6330, fuel: 2, lateMinutes: 0, lateFee: 0, damageFee: 0, fuelFee: 0 },
    }),
    booking({
      id: "bk-hendra", vehicleId: "v3", customerId: "c-hendra", start: t0 - 6 * 24 * H, end: t0 - 5 * 24 * H, status: "completed",
      price: { base: 110_000, delivery: 20_000, total: 130_000, tierLabel: "24 jam" },
      handover: { at: t0 - 6 * 24 * H, km: 9010, fuel: 4, deposits: ["KTP asli"], photos: 4, signed: true, by: "Andi" },
      returned: { at: t0 - 5 * 24 * H, km: 9120, fuel: 3, lateMinutes: 0, lateFee: 0, damageFee: 0, fuelFee: 0 },
    }),
    booking({
      id: "bk-rina-old", vehicleId: "v1", customerId: "c-rina", start: t0 - 9 * 24 * H, end: t0 - 8 * 24 * H + 12 * H, status: "completed",
      price: { base: 200_000, delivery: 0, total: 200_000, tierLabel: "36 jam" },
      handover: { at: t0 - 9 * 24 * H, km: 18300, fuel: 4, deposits: ["KTP asli"], photos: 4, signed: true, by: "Raka" },
      returned: { at: t0 - 8 * 24 * H + 12 * H, km: 18420, fuel: 3, lateMinutes: 25, lateFee: 15_000, damageFee: 0, fuelFee: 0 },
    }),
  ];
}

function makeZones(t0: number): Zone[] {
  return [
    {
      id: "z-service-gsm", name: "Area layanan GSM", kind: "service", scope: "store", storeId: "gsm",
      note: "Kota Bogor, Dramaga, Ciawi, dan Sentul", active: true, createdAt: t0,
      polygon: ring([
        [106.7, -6.52], [106.8, -6.505], [106.88, -6.52], [106.9, -6.56], [106.88, -6.61], [106.862, -6.65],
        [106.855, -6.67], [106.83, -6.672], [106.79, -6.65], [106.74, -6.63], [106.7, -6.6], [106.69, -6.56],
      ]),
    },
    {
      id: "z-puncak", name: "Puncak – Cisarua", kind: "restricted", scope: "store", storeId: "gsm",
      note: "Tanjakan panjang, matic rawan overheat", active: true, createdAt: t0,
      polygon: ZONE_PRESETS[0].polygon,
    },
    {
      id: "z-merak", name: "Pelabuhan Merak", kind: "restricted", scope: "platform",
      note: "Penyeberangan keluar Pulau Jawa", active: true, createdAt: t0, polygon: box(105.997, -5.931, 0.02),
    },
    {
      id: "z-priok", name: "Pelabuhan Tanjung Priok", kind: "restricted", scope: "platform",
      note: "Pelabuhan kapal antarpulau", active: true, createdAt: t0, polygon: box(106.886, -6.104, 0.015),
    },
  ];
}

export function createWorld(t0: number, epoch: number, id: string): World {
  const vehicles = makeVehicles();
  // Status awal yang beragam: satu unit servis, satu menunggu cek kondisi.
  const v4 = vehicles.find((v) => v.id === "v4")!;
  v4.maintenance = { since: t0 - 3 * H, until: t0 + 5 * H, reason: "Ganti kampas rem depan", scheduled: true };
  vehicles.find((v) => v.id === "v8")!.inspection = true;
  vehicles.find((v) => v.id === "v3")!.serviceLog = [
    { id: "sl-1", at: t0 - 20 * 24 * H, km: 8480, items: [{ name: "Ganti oli mesin", cost: 55_000 }] },
  ];
  return {
    id, epoch, rev: 0, t0, clockOffset: 0,
    stores: makeStores(t0),
    vehicles,
    customers: makeCustomers(t0),
    bookings: makeBookings(t0),
    zones: makeZones(t0),
    alerts: [],
    alertState: {},
    sim: { running: false, progress: 0, speed: 0.6, signalOff: {} },
    seen: [],
    config: { signalLostAfterSec: 25 },
  };
}

export const INCOMING_NAMES = [
  { name: "Nadia Putri", phone: "081310008821", ig: "@nadiapt" },
  { name: "Rizky Pratama", phone: "085910004417", ig: "@rizkyprtm" },
  { name: "Ayu Lestari", phone: "081710002236", ig: "@ayulst" },
];

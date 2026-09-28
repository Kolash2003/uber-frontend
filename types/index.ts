export type UserRole = "rider" | "driver" | "admin";

export type LatLng = {
  lat: number;
  lng: number;
};

export type Address = {
  id: string;
  label: string;
  primary: string;
  secondary?: string;
  location: LatLng;
};

export type PaymentMethod = {
  id: string;
  brand: "visa" | "mastercard" | "amex" | "discover";
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  holderName: string;
};

export type RideType = "economy" | "comfort" | "premium" | "xl";

export type RideTypeMeta = {
  id: RideType;
  name: string;
  description: string;
  capacity: number;
  etaMinutes: number;
  multiplier: number;
  icon: "car" | "car-front" | "crown" | "truck";
};

export type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  totalTrips: number;
  photoUrl?: string;
  phoneNumber?: string;
};

export type Vehicle = {
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  year: number;
};

export type TripStatus =
  | "idle"
  | "searching"
  | "matched"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Trip = {
  id: string;
  status: TripStatus;
  rideType: RideType;
  pickup: Address;
  dropoff: Address;
  fare: FareEstimate;
  paymentMethodId: string;
  driver?: Driver & { vehicle: Vehicle; location: LatLng };
  etaSeconds?: number;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  rating?: number;
  tip?: number;
  routePolyline?: LatLng[];
  distanceKm?: number;
  durationMinutes?: number;
};

export type FareEstimate = {
  rideType: RideType;
  base: number;
  distanceFare: number;
  timeFare: number;
  surge: number;
  total: number;
  currency: "USD";
  estimatedDistanceMiles: number;
  estimatedDurationMinutes: number;
};

export type EarningsByDay = {
  date: string;
  trips: number;
  earnings: number;
  onlineMinutes: number;
};

export type ConnectivityState = "online" | "reconnecting" | "offline";

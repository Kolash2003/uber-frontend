import type {
  Address,
  Driver,
  EarningsByDay,
  PaymentMethod,
  Trip,
  Vehicle,
  RideTypeMeta,
} from "@/types";

export const RIDE_TYPES: RideTypeMeta[] = [
  {
    id: "economy",
    name: "UberX",
    description: "Affordable rides for everyday trips",
    capacity: 4,
    etaMinutes: 3,
    multiplier: 1,
    icon: "car",
  },
  {
    id: "comfort",
    name: "Comfort",
    description: "Newer cars with more legroom",
    capacity: 4,
    etaMinutes: 5,
    multiplier: 1.25,
    icon: "car-front",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Luxury rides with top-rated drivers",
    capacity: 4,
    etaMinutes: 7,
    multiplier: 1.85,
    icon: "crown",
  },
  {
    id: "xl",
    name: "XL",
    description: "SUVs and vans for up to 6 riders",
    capacity: 6,
    etaMinutes: 6,
    multiplier: 1.6,
    icon: "truck",
  },
];

export const SAVED_PLACES: Address[] = [
  {
    id: "home",
    label: "Home",
    primary: "742 Evergreen Terrace",
    secondary: "Springfield, OR 97477",
    location: { lat: 44.0462, lng: -123.0220 },
  },
  {
    id: "work",
    label: "Work",
    primary: "1 Apple Park Way",
    secondary: "Cupertino, CA 95014",
    location: { lat: 37.3349, lng: -122.0090 },
  },
  {
    id: "recent-1",
    label: "Recent",
    primary: "Dolores Park",
    secondary: "San Francisco, CA",
    location: { lat: 37.7596, lng: -122.4269 },
  },
];

export const SAVED_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm_1",
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2028,
    isDefault: true,
    holderName: "Aneesh R",
  },
  {
    id: "pm_2",
    brand: "mastercard",
    last4: "5555",
    expMonth: 4,
    expYear: 2027,
    isDefault: false,
    holderName: "Aneesh R",
  },
  {
    id: "pm_3",
    brand: "amex",
    last4: "0005",
    expMonth: 9,
    expYear: 2026,
    isDefault: false,
    holderName: "Aneesh R",
  },
];

const MOCK_VEHICLE: Vehicle = {
  make: "Toyota",
  model: "Camry",
  color: "Silver",
  licensePlate: "8XYZ123",
  year: 2022,
};

export const MOCK_DRIVER: Driver & { vehicle: Vehicle } = {
  id: "drv_1234",
  firstName: "Marcus",
  lastName: "Chen",
  rating: 4.92,
  totalTrips: 1847,
  photoUrl: undefined,
  phoneNumber: "+1 415 555 0142",
  vehicle: MOCK_VEHICLE,
};

export const MOCK_TRIPS: Trip[] = [
  {
    id: "trip_001",
    status: "completed",
    rideType: "economy",
    pickup: {
      id: "p1",
      label: "Pickup",
      primary: "Civic Center BART",
      secondary: "San Francisco, CA",
      location: { lat: 37.7798, lng: -122.4138 },
    },
    dropoff: {
      id: "d1",
      label: "Dropoff",
      primary: "SFO Airport",
      secondary: "San Francisco, CA",
      location: { lat: 37.6213, lng: -122.379 },
    },
    fare: {
      rideType: "economy",
      base: 2.5,
      distanceFare: 22.4,
      timeFare: 11.6,
      surge: 1,
      total: 36.5,
      currency: "USD",
      estimatedDistanceMiles: 13.2,
      estimatedDurationMinutes: 26,
    },
    paymentMethodId: "pm_1",
    driver: { ...MOCK_DRIVER, firstName: "Priya", lastName: "Patel", location: { lat: 37.6213, lng: -122.379 } },
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 26).toISOString(),
    rating: 5,
    tip: 5,
  },
  {
    id: "trip_002",
    status: "completed",
    rideType: "comfort",
    pickup: {
      id: "p2",
      label: "Pickup",
      primary: "Ferry Building",
      secondary: "San Francisco, CA",
      location: { lat: 37.7955, lng: -122.3937 },
    },
    dropoff: {
      id: "d2",
      label: "Dropoff",
      primary: "Mission Dolores",
      secondary: "San Francisco, CA",
      location: { lat: 37.7596, lng: -122.4269 },
    },
    fare: {
      rideType: "comfort",
      base: 2.5,
      distanceFare: 9.8,
      timeFare: 6.4,
      surge: 1,
      total: 18.7,
      currency: "USD",
      estimatedDistanceMiles: 3.1,
      estimatedDurationMinutes: 14,
    },
    paymentMethodId: "pm_1",
    driver: { ...MOCK_DRIVER, firstName: "James", lastName: "Okafor", location: { lat: 37.7596, lng: -122.4269 } },
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 14).toISOString(),
    rating: 5,
    tip: 3,
  },
  {
    id: "trip_003",
    status: "completed",
    rideType: "economy",
    pickup: {
      id: "p3",
      label: "Pickup",
      primary: "Hayes Valley",
      secondary: "San Francisco, CA",
      location: { lat: 37.7762, lng: -122.4239 },
    },
    dropoff: {
      id: "d3",
      label: "Dropoff",
      primary: "Embarcadero",
      secondary: "San Francisco, CA",
      location: { lat: 37.7989, lng: -122.3978 },
    },
    fare: {
      rideType: "economy",
      base: 2.5,
      distanceFare: 6.2,
      timeFare: 4.0,
      surge: 1,
      total: 12.7,
      currency: "USD",
      estimatedDistanceMiles: 1.8,
      estimatedDurationMinutes: 9,
    },
    paymentMethodId: "pm_2",
    driver: { ...MOCK_DRIVER, firstName: "Sofia", lastName: "Reyes", location: { lat: 37.7989, lng: -122.3978 } },
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 9).toISOString(),
    rating: 4,
  },
];

export const MOCK_EARNINGS: EarningsByDay[] = [
  { date: "Mon", trips: 12, earnings: 248.5, onlineMinutes: 312 },
  { date: "Tue", trips: 15, earnings: 312.2, onlineMinutes: 365 },
  { date: "Wed", trips: 9, earnings: 178.4, onlineMinutes: 245 },
  { date: "Thu", trips: 18, earnings: 387.9, onlineMinutes: 410 },
  { date: "Fri", trips: 22, earnings: 462.3, onlineMinutes: 445 },
  { date: "Sat", trips: 25, earnings: 521.6, onlineMinutes: 478 },
  { date: "Sun", trips: 14, earnings: 286.7, onlineMinutes: 322 },
];

export const GEOCODE_RESULTS: Address[] = [
  {
    id: "g1",
    label: "Result",
    primary: "Golden Gate Bridge",
    secondary: "San Francisco, CA",
    location: { lat: 37.8199, lng: -122.4783 },
  },
  {
    id: "g2",
    label: "Result",
    primary: "Union Square",
    secondary: "San Francisco, CA",
    location: { lat: 37.788, lng: -122.4074 },
  },
  {
    id: "g3",
    label: "Result",
    primary: "Coit Tower",
    secondary: "San Francisco, CA",
    location: { lat: 37.8024, lng: -122.4058 },
  },
  {
    id: "g4",
    label: "Result",
    primary: "Lombard Street",
    secondary: "San Francisco, CA",
    location: { lat: 37.8021, lng: -122.4187 },
  },
  {
    id: "g5",
    label: "Result",
    primary: "Alamo Square",
    secondary: "San Francisco, CA",
    location: { lat: 37.7763, lng: -122.4346 },
  },
];

export const DEFAULT_MAP_CENTER = { lat: 37.7749, lng: -122.4194 };

export const FAKE_ROUTE: { lat: number; lng: number }[] = [
  { lat: 37.7749, lng: -122.4194 },
  { lat: 37.7798, lng: -122.4138 },
  { lat: 37.7858, lng: -122.4065 },
  { lat: 37.792, lng: -122.399 },
  { lat: 37.7989, lng: -122.3978 },
];

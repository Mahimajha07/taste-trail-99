
export interface User {
  id: string;
  name: string;
  gender: string;
  age: number;
  avatar?: string;
  email?: string;
  phone?: string;
  badges?: string[];
}

export interface Review {
  author: string;
  text: string;
  rating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  date?: string;
  isUserGenerated?: boolean;
  images?: string[];
  isHealthReview?: boolean;
  isVerified?: boolean;
  metrics?: {
    taste: number;
    health: number;
    presentation: number;
    delivery: number;
  };
}

export interface PopularDish {
  name: string;
  price?: string;
  description?: string;
  image?: string;
  isVerified?: boolean;
  orderUrl?: string;
  nutritionalInfo?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
}

export interface Restaurant {
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  description: string;
  address: string;
  phone?: string;
  operatingHours?: string;
  matchScore: number;
  whyMatch: string;
  reviews: Review[];
  flavorProfile?: {
    spicy: number;
    sweet: number;
    umami: number;
  };
  swiggyUrl?: string;
  zomatoUrl?: string;
  magicpinUrl?: string;
  uberEatsUrl?: string;
  thriveUrl?: string;
  dunzoUrl?: string;
  orderUrl?: string;
  mapsUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  popularDishes?: PopularDish[];
  healthScore?: number;
  nutritionalHighlights?: string[];
  allergenAlerts?: string[];
  bestPlatform?: string;
  activeDeal?: string;
  visualKeyword?: string;
}

export interface Booking {
  id: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  cuisine?: string;
  address?: string;
}

export interface TasteProfile {
  dietaryPreferences: string[]; // e.g., 'Vegan', 'Keto', 'Gluten-Free'
  preferredTextures: string[]; // e.g., 'Crunchy', 'Creamy', 'Chewy'
  preferredCuisines: string[]; // e.g., 'Indian', 'Italian'
  features: string[]; // e.g., 'trending', 'healthy', 'budget'
  atmosphere: string; // e.g., "Lively", "Romantic", "Casual"
  diningTheme: string; // e.g., "Casual", "Fine Dining", "Street Style"
  budget: string; // e.g., "₹₹"
  customNotes: string; // User's free-form craving
  occasion: 'Party' | 'Date' | 'Family' | 'Solo' | 'Work' | '';
  maxDistance: string; // e.g., "25km", "Global"
  ageGroup: 'Kid' | 'Gen-Z' | 'Adult' | 'Senior' | '';
  comfortPreference: 'Cozy' | 'Vibrant' | 'Luxury' | 'Casual' | ''; // Further refined atmosphere
  healthGoal: 'Weight Loss' | 'Muscle Gain' | 'Balanced' | 'Keto' | 'Detox' | '';
  showDealsOnly?: boolean;
  isHealthyScout?: boolean;
  onlineOrderingOnly?: boolean;
  deliveryPriority?: 'Fastest' | 'Cheapest' | 'Quality' | '';
  preferredFlourTypes: string[]; // NEW: e.g., 'Whole Wheat', 'Gluten-Free'
  seatingPreferences: string[]; // NEW: e.g., 'Indoor', 'Outdoor', 'Rooftop'
  facilities: string[]; // NEW: e.g., 'Parking', 'Wi-Fi', 'Kids Zone', 'Pet-Friendly', 'Accessibility'
  musicVibe: string; // NEW: e.g., 'Live Band', 'DJ', 'Soft Background', 'Quiet'
  specialDecor: string[]; // NEW: e.g., 'Festival Decor', 'Themed Decor'
  noiseLevel: string; // NEW: e.g., 'Quiet', 'Moderate', 'Lively'
  lightingStyle: string; // NEW: e.g., 'Dim Romantic', 'Bright Casual', 'Themed'
  favoriteFlavors: string[]; // Re-added for flavor game results
}

export interface PalateProfile {
  archetype: string;
  description: string;
  traitTags: string[];
}

export interface GroundingSource {
  title?: string;
  uri: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sources?: GroundingSource[];
}

export interface GastroStory {
  id: string;
  restaurantName: string;
  dishName: string;
  image: string;
  avatar: string;
  isLive?: boolean;
}
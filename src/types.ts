// Represents the user model from our database
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
}

// Represents the authenticated user state in the frontend
export interface AuthUser extends User {
  token: string;
}

// Kept for components that haven't been fully refactored from the old Telegram-based system.
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}


export interface Ad {
  id: string;
  title: string;
  description: string;
  price: string;
  previousPrice?: string;
  category: string;
  imageUrls: string[];
  createdAt: string;
  location: string;
  tags?: string[];
  sellerId: string;
  seller: {
    id:string;
    name: string;
    avatarUrl?: string;
    // Optional fields for partial component compatibility
    rating?: number;
    reviewsCount?: number;
    isVerified?: boolean;
    telegramUsername?: string; // Kept for legacy compatibility
  };
  status: AdStatus;
  isBoosted: boolean;
   // Optional fields for component compatibility
  stats?: {
    views: number;
    favorites: number;
  };
  allowOffers?: boolean;
}

export interface GeneratedAdData {
  title: string;
  description: string;
  category: string;
  price: string;
  location: string;
  tags: string[];
}

export type Page = 'home' | 'create' | 'detail' | 'profile' | 'favorites' | 'sellerProfile' | 'chats' | 'chatThread' | 'savedSearches' | 'map' | 'following' | 'auth';

export type AdStatus = 'active' | 'reserved' | 'sold' | 'archived' | 'in_delivery';
export type UserStatus = 'active' | 'banned';
export type UserRole = 'USER' | 'ADMIN';

// --- i18n ---
export type Locale = 'uk' | 'en' | 'ru';


export interface Review {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    sellerId: string;
    rating: number; // 1 to 5
    text: string;
    createdAt: string;
}

// --- Admin Panel Specific Types ---
export interface AdminUser extends User {
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    status: UserStatus;
}

export interface AdminAd extends Ad {
    sellerName: string; // From the DB join
    isBoosted: boolean;
}

// Add a new type for the admin dashboard statistics.
export interface AdminStats {
  totalUsers: number;
  totalAds: number;
  adsByCategory: { category: string; count: string }[];
  soldAds: number;
  bannedUsers: number;
}

export interface DailyCount {
    date: string;
    count: number;
}

export interface AnalyticsData {
    userRegistrations: DailyCount[];
    adPostings: DailyCount[];
}

export interface StorageSettings {
  storage_provider: 'local' | 's3' | 'gcs';
  s3_bucket: string;
  s3_region: string;
  s3_access_key_id: string;
  s3_secret_access_key: string; // Will be placeholder '********' or new value
  gcs_bucket: string;
  gcs_project_id: string;
  gcs_credentials: string; // Will be placeholder '********' or new value
}


export interface NewReviewPayload {
    sellerId: string;
    rating: number;
    text: string;
}

export interface OfferDetails {
    price: string;
    status: 'pending' | 'accepted' | 'declined';
}

export interface SecureDealDetails {
    status: 'payment_pending' | 'shipping_pending' | 'delivery_pending' | 'completed';
    adId: string;
    sellerId: string;
    buyerId: string;
}


// --- Chat Types ---
export interface ChatMessage {
    id: string;
    text: string | null;
    imageUrl?: string | null;
    senderId: string;
    receiverId: string;
    adId: string;
    createdAt: string; // ISO 8601
    isRead: boolean;
    // For optimistic UI
    senderName?: string;
    senderAvatar?: string;
}

// Type for the list view
export interface ChatConversation {
    adId: string;
    adTitle: string;
    adImageUrls: string[];
    participantId: string;
    participantName: string;
    participantAvatarUrl?: string;
    lastMessageText: string;
    lastMessageAt: string;
    isRead: boolean;
    senderId: string; // ID of the user who sent the last message
}

// Context needed to open a chat thread
export interface ChatContext {
    adId: string;
    adTitle: string;
    adImageUrl?: string;
    participantId: string;
    participantName: string;
}


export interface SavedSearch {
  id: string;
  query: string;
  category: string;
  filters: {
    location: string;
    priceFrom: string;
    priceTo: string;
  };
  createdAt: string;
}

export interface ImageSearchQuery {
    query: string;
    category: string;
}

export interface Question {
    id: string;
    adId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    text: string;
    createdAt: string;
    answer?: Answer;
}

export interface Answer {
    id: string;
    questionId: string;
    authorId: string; // Seller's ID
    text: string;
    createdAt: string;
}

export interface Follow {
    followerId: string;
    sellerId: string;
}

// --- Rebranding Types ---
export interface HomePageBanner {
    id: string;
    imageUrl: string;
    title: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
}

export interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

export interface RegionStat {
    region: string;
    count: number;
}

export interface AutomationRunHistory {
    id: string;
    flowId: string;
    triggerType: string;
    triggerData: any; // JSONB
    status: 'STARTED' | 'SUCCESS' | 'FAILED';
    logs: string[]; // TEXT[]
    createdAt: string; // TIMESTAMP
    updatedAt: string; // TIMESTAMP
}
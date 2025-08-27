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
    id: string;
    name: string;
    avatarUrl?: string;
    // Optional fields for partial component compatibility
    rating?: number;
    reviewsCount?: number;
    isVerified?: boolean;
    telegramUsername?: string; // Kept for legacy compatibility
  };
  status: AdStatus;
  isBoosted?: boolean;
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

export type Page = 'home' | 'create' | 'detail' | 'profile' | 'favorites' | 'sellerProfile' | 'chats' | 'chatThread' | 'savedSearches' | 'map' | 'following' | 'admin' | 'auth';

export type AdStatus = 'active' | 'reserved' | 'sold' | 'archived' | 'in_delivery';

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
}

export interface AdminAd extends Ad {
    sellerName: string; // From the DB join
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


export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    text?: string;
    imageUrl?: string;
    timestamp: string; // ISO 8601
    isRead: boolean;
    isSystemMessage?: boolean;
    offerDetails?: OfferDetails;
    secureDealDetails?: SecureDealDetails;
    adId?: string; // The ad this message is about
}

export interface ChatConversation {
    id: string; // combination of user IDs and potentially ad ID
    adId?: string; // The ad this conversation is about
    participant: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    lastMessage: ChatMessage;
    unreadCount: number;
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
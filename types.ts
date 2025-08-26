export interface Ad {
  id: string;
  title: string;
  description: string;
  price: string;
  previousPrice?: string; // For price drop notifications
  category: string;
  imageUrls: string[];
  createdAt: string; // ISO 8601 date string
  location: string;
  tags?: string[];
  seller: {
    id: number;
    name: string;
    avatarUrl: string;
    telegramUsername: string;
    rating: number;
    reviewsCount: number;
    isVerified: boolean;
  };
  status: AdStatus;
  isBoosted?: boolean;
  stats: {
    views: number;
    favorites: number;
  };
  allowOffers?: boolean; // New: To enable/disable price offers
}

export interface GeneratedAdData {
  title: string;
  description:string;
  category: string;
  price: string;
  location: string;
  tags: string[];
}

export type Page = 'home' | 'create' | 'detail' | 'profile' | 'favorites' | 'sellerProfile' | 'chats' | 'chatThread' | 'savedSearches' | 'map' | 'following';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export type AdStatus = 'active' | 'reserved' | 'sold' | 'archived' | 'in_delivery';

export interface Review {
    id: string;
    authorId: number;
    authorName: string;
    authorAvatarUrl: string;
    sellerId: number;
    rating: number; // 1 to 5
    text: string;
    createdAt: string;
}

export interface NewReviewPayload {
    sellerId: number;
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
    sellerId: number;
    buyerId: number;
}

export interface ChatMessage {
    id: string;
    senderId: number; // 0 for system messages
    receiverId: number;
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
        id: number;
        name: string;
        avatarUrl: string;
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
    authorId: number;
    authorName: string;
    authorAvatarUrl: string;
    text: string;
    createdAt: string;
    answer?: Answer;
}

export interface Answer {
    id: string;
    questionId: string;
    authorId: number; // Seller's ID
    text: string;
    createdAt: string;
}

export interface Follow {
    followerId: number;
    sellerId: number;
}
// Represents the user model from our database
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

// Represents the authenticated user state in the frontend
export interface AuthUser extends User {
  token: string;
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
    // We can add more seller details here later, like rating
  };
  status: AdStatus;
  isBoosted?: boolean;
  // Stats would be calculated on the backend now
}

export interface GeneratedAdData {
  title: string;
  description: string;
  category: string;
  price: string;
  location: string;
  tags: string[];
}

export type Page = 'home' | 'create' | 'detail' | 'profile' | 'favorites' | 'sellerProfile' | 'chats' | 'chatThread' | 'savedSearches' | 'map' | 'following';


export type AdStatus = 'active' | 'reserved' | 'sold' | 'archived' | 'in_delivery';

// Other types remain largely the same for now
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

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
  adId?: string;
}

export interface ChatConversation {
    id: string;
    adId?: string;
    participant: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    lastMessage: ChatMessage;
    unreadCount: number;
}

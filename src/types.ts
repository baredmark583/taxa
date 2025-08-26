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
}

export interface GeneratedAdData {
  title: string;
  description: string;
  category: string;
  price: string;
  location: string;
  tags: string[];
}

export type Page = 'home' | 'create' | 'detail' | 'profile' | 'favorites' | 'sellerProfile';

export type AdStatus = 'active' | 'reserved' | 'sold' | 'archived';

// Other types like Review, Chat can be added later as we refactor those features

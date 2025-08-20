// types.ts

export interface User {
    _id: string;
    name: string;
    username: string;
    city: string;
    country: string;
    bio: string;
    profilePic?: string;
    phone?: string;
    role: 'user' | 'admin';
    followers: string[];
    following: string[];
    instagramUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Story {
  createdAt: any; // Consider using Date or string for better typing
  _id: string;
  mediaUrl: string;
  caption?: string;
  user: {
    _id: string;
    username: string;
    profilePic?: string;
  };
  expiresAt: string; // ISO date string
  viewers: string[];
}

export interface StoryGroup {
  userId: string;
  username: string;
  profilePic?: string;
  stories: Story[];
}

export interface StoryViewerModalProps {
  stories: StoryGroup[];
  initialStoryGroupIndex: number;
  initialStoryIndexInGroup: number;
  onClose: () => void;
  currentUserId: string;
  token: string;
}

export interface Listing {
    _id: string;
    title: string;
    description: string;
    images: string[];
    city: string; // Directly on Listing
    country: string; // Directly on Listing
    price: number; // Primary price, assuming it's a single value
    pricePerMonth?: number; // Optional, if different pricing models exist
    pricePerWeek?: number;  // Optional
    pricePerNight?: number; // Optional
    availableFrom?: string; // ISO date string
    availableTo?: string;   // ISO date string
    availability: { // Specific availability periods
        startDate: string;
        endDate: string;
    }[];
    likes: string[]; // Array of user IDs who liked the listing
    details: string; // Could be a more detailed description than 'description'
    type: 'Single Room' | 'Whole Apartment' | 'Whole House';
    amenities: string[];
    roommates: string[]; // Corrected type to string[]
    tags: string[];
    thumbnail: string; // Assuming a distinct thumbnail URL
    user: { // The user who owns/posted the listing (basic info)
        _id: string;
        name: string;
    };
    category: string;
    condition: string;
    owner: string | User; // Can be string ID or populated User object
    createdAt: string;
    updatedAt: string;
    // Note: The 'location?: string;' at the end of your provided Listing was removed
    // as 'city' and 'country' are more specific and directly on the object.
}

export interface Post {
    _id: string;
    user: {
        _id: string;
        name: string;
        username: string;
        profilePic?: string;
    };
    caption: string;
    tags: string[];
    city: string;
    country: string;
    imageUrl: string; // This seems to be the main image for the post
    images: string[]; // This might be for multiple images if 'imageUrl' is just a primary one
    status: 'draft' | 'published';
    createdAt: string;
    updatedAt: string;
}
// types.ts
export interface User {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
}

export interface Listing {
    _id: string;
    user: User;
    title: string;
    details: string;
    type: 'Single Room' | 'Whole Apartment' | 'Whole House';
    amenities: string[];
    features: string[];
    city: string;
    country: string;
    roommates: string[];
    petTypes: string[];
    tags: string[];
    availability: string[];
    images: string[];
    thumbnail: string;
    status: 'draft' | 'published';
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    commentsCount: number;
}

export interface Comment {
    _id: string;
    user: User;
    text: string;
    createdAt: string;
    parentCommentId?: string;
    parentComment?: string | Comment;
    replies?: Comment[];
    isLikedByUser?: boolean;
    likesCount?: number;
}
// story/types.ts
export interface Story {
  createdAt: any;
  _id: string;
  mediaUrl: string;
  caption?: string;
  user: {
    _id: string;
    username: string;
    profilePic?: string;
  };
  expiresAt: string;
  viewers: string[];
}

export interface User {
  _id: string;
  name: string;
  username: string;
  profilePic?: string;
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
  API_BASE_URL: string; // Keep this for now, will get from Constants
}
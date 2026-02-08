
export enum Page {
  HOME = 'home',
  RANKING = 'ranking',
  POST = 'post',
  MESSAGES = 'messages',
  PROFILE = 'profile',
  DETAILS = 'details'
}

export type AvatarStyle = 'suit-man' | 'casual-woman' | 'uncle' | 'fresh-boy' | 'mature-woman' | 'mystery';

export interface RoastTarget {
  id: string;
  name: string;
  type: string;
  description: string;
  tags: string[];
  avatarStyle: AvatarStyle;
  avatarUrl: string;
  roastCount: number;
  totalLikes: number;
  heatIndex: number;
  topRoastPreview?: string;
  creatorId: string;
}

export type RoastType = 'text' | 'image' | 'audio';

export interface RoastComment {
  id: string;
  targetId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: RoastType;
  mediaUrl?: string;
  duration?: number; // for audio
  likes: number;
  isChampion: boolean;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  unlocked: boolean;
}

export interface UserStats {
  targetsCreated: number;
  roastsPosted: number;
  likesReceived: number;
}

export interface AppUser {
  id: string;
  name: string;
  avatar: string;
  badges: string[]; // ids
  stats: UserStats;
  quote?: string;
  level?: number;
  email?: string;
}

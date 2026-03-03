export interface Member {
    _id?: string;
    id?: string;
    membership_no: string;
    name: string;
    mobile?: string;
    male?: number;
    female?: number;
    district?: string;
    taluka?: string;
    panchayat?: string;
    village?: string;
    aadhar_no?: string;
    family_members?: FamilyMember[];
    address?: string;
    head_gender?: string;
    profile_photo_url?: string;
    last_portal_login?: string;
    is_subscribed?: boolean;
    is_verified?: boolean; // Phase 5: Verified Badge
}

export interface Photo {
    id: string;
    url: string;
    caption?: string;
    created_at: string;
}

export interface FamilyMember {
    name: string;
    relation: string;
    gender: string;
    age?: number;
    mobile?: string;
    profile_photo_url?: string;
}

export interface LoggedUser {
    name: string;
    relation: string;
    mobile?: string;
    profile_photo_url?: string | null;
    gender?: string | null;
}

// ─── Reaction system (Phase 1) ──────────────────────
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface ReactionCount {
    like: number;
    love: number;
    haha: number;
    wow: number;
    sad: number;
    angry: number;
}

// ─── Comments with nesting (Phase 1) ────────────────
export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    parentId?: string;        // For nested replies
    replies?: Comment[];      // Nested replies
    likes?: number;
    isLiked?: boolean;
}

// ─── Media attachment (Phase 1: video support) ──────
export interface MediaItem {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;       // Video thumbnail
}

// ─── Post with full Phase 1+2 features ──────────────
export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    authorVerified?: boolean;    // Phase 5: Verified Badge
    authorMembershipNo?: string; // for linking to profile
    location?: string;
    content: string;
    images?: string[];           // Legacy image URLs
    media?: MediaItem[];         // New: mixed image/video
    likes: number;
    reactions?: ReactionCount;   // Per-reaction counts
    myReaction?: ReactionType | null;  // Current user's reaction
    comments: Comment[];
    commentsCount?: number;
    timestamp: string;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isShared?: boolean;
    shareCount?: number;
    hashtags?: string[];
    mentions?: string[];
    poll?: Poll;                 // Phase 2: embedded poll
}

// ─── Polls (Phase 2) ────────────────────────────────
export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Poll {
    question: string;
    options: PollOption[];
    totalVotes: number;
    myVote?: string;             // Option ID user voted for
    endsAt?: string;             // Poll expiration
}

// ─── Status Updates (Phase 2) ───────────────────────
export interface StatusUpdate {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    text: string;
    emoji: string;
    bgColor: string;             // Gradient CSS class
    timestamp: string;
}

export interface Story {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    timestamp: string;
    viewed?: boolean;
    // Phase 2: text overlays
    textOverlay?: string;
    textPosition?: 'top' | 'center' | 'bottom';
    textColor?: string;
    textSize?: 'sm' | 'md' | 'lg';
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    receiverId?: string;
    groupId?: string;
    content: string;
    timestamp: string;
    read: boolean;
    type: 'text' | 'image' | 'file';
}

export interface AuthState {
    member: Member | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (membershipNo: string, mobile: string) => Promise<void>;
    logout: () => void;
}

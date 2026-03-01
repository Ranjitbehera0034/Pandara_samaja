// src/types/chat.ts

export interface ChatContact {
    contact_id: string;
    contact_name: string;
    contact_avatar: string | null;
    last_message: string;
    last_message_time: string;
    unread_count: number;
}

export interface ChatMessage {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar: string | null;
    receiver_id: string;
    receiver_name?: string;
    content: string;
    created_at: string;
    read: boolean;
    type: string; // 'text' | 'image' | 'voice' | 'file'
    reactions?: Record<string, string[]>; // emoji -> userIds
    voiceDuration?: number; // seconds
}

export interface GroupChat {
    id: string;
    name: string;
    avatar?: string;
    members: string[];
    memberNames: string[];
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isGroup: true;
}

export interface MemberOption {
    membership_no: string;
    name: string;
    profile_photo_url: string | null;
    village?: string;
}

export interface CallState {
    active: boolean;
    type: 'audio' | 'video';
    contactName: string;
    contactId: string;
    status: 'calling' | 'connected' | 'ended';
    duration: number;
}

// src/hooks/useChatSocket.ts
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/apiConfig';

export const useChatSocket = (myId: string, member: any) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const token = localStorage.getItem('portalToken');
        if (!token || !myId) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            const userMobile = (member?.mobile || '').replace(/\D/g, '');
            newSocket.emit('join_chat', { mobile: userMobile });
            newSocket.emit('get_online_users');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('online_users', (users: string[]) => {
            setOnlineUsers(new Set(users));
        });

        newSocket.on('user_online', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => new Set([...prev, userId]));
        });

        newSocket.on('user_offline', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        });

        newSocket.on('typing_start', ({ senderId }: { senderId: string }) => {
            setTypingUsers(prev => new Set([...prev, senderId]));
        });

        newSocket.on('typing_stop', ({ senderId }: { senderId: string }) => {
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(senderId);
                return next;
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [myId, member]);

    return {
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
    };
};

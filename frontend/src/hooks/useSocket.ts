import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const { token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (token && !socketRef.current) {
            // Initialize socket connection
            const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

            socketRef.current = io(backendUrl, {
                auth: { token },
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to real-time notification service');
            });

            socketRef.current.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });
        }

        // Cleanup on unmount or token change
        return () => {
            if (socketRef.current && !token) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [token]);

    return socketRef.current;
};

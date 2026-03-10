import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';

let io: Server;

// Map user ID to their socket connection(s). 
// One user can have multiple open tabs/devices.
const userSockets = new Map<string, string[]>();

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:3000',
                process.env.FRONTEND_URL || ''
            ],
            credentials: true,
        },
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

            // Look up user to ensure they are active
            const user = await User.findById(decoded.id).select('isActive role');
            if (!user || !user.isActive) {
                return next(new Error('Authentication error: User inactive or not found'));
            }

            // Attach user data to socket
            socket.data.userId = decoded.id;
            socket.data.role = user.role;

            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId;

        // Register socket to user
        if (!userSockets.has(userId)) {
            userSockets.set(userId, []);
        }
        userSockets.get(userId)?.push(socket.id);

        console.log(`User ${userId} connected. Socket ID: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected. Socket ID: ${socket.id}`);

            // Remove socket from user's active sockets
            const sockets = userSockets.get(userId);
            if (sockets) {
                const index = sockets.indexOf(socket.id);
                if (index !== -1) {
                    sockets.splice(index, 1);
                }

                // Keep the map clean
                if (sockets.length === 0) {
                    userSockets.delete(userId);
                }
            }
        });
    });
};

/**
 * Broadcast an event to all connected sockets
 */
export const broadcast = (event: string, data: any) => {
    if (io) {
        io.emit(event, data);
    }
};

/**
 * Send an event to a specific user (across all their active devices)
 */
export const emitToUser = (userId: string, event: string, data: any) => {
    if (io && userSockets.has(userId)) {
        const sockets = userSockets.get(userId);
        sockets?.forEach((socketId) => {
            io.to(socketId).emit(event, data);
        });
    }
};

/**
 * Send an event to all users holding a specific role
 */
export const broadcastToRole = (role: string, event: string, data: any) => {
    if (io) {
        // Iterate through all connected sockets to find matching roles
        // Alternatively, we could have maintained a role-to-socket map, but this is fine for now
        io.sockets.sockets.forEach((socket) => {
            if (socket.data.role === role) {
                socket.emit(event, data);
            }
        });
    }
};

import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'

let io: SocketIOServer | null = null

/**
 * Initialize Socket.io server with Redis adapter
 */
export function initializeSocketServer(httpServer: NetServer): SocketIOServer {
    if (io) {
        return io
    }

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    })

    // Set up Redis adapter for horizontal scaling
    const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    const subClient = pubClient.duplicate()

    io.adapter(createAdapter(pubClient, subClient))

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`)

        // Join studio room
        socket.on('join-studio', (studioId: string) => {
            console.log(`👤 Socket ${socket.id} joining studio: ${studioId}`)
            socket.join(studioId)

            // Notify others in the room
            socket.to(studioId).emit('participant-joined', {
                socketId: socket.id,
                timestamp: new Date().toISOString(),
            })
        })

        // Leave studio room
        socket.on('leave-studio', (studioId: string) => {
            console.log(`👤 Socket ${socket.id} leaving studio: ${studioId}`)
            socket.leave(studioId)

            // Notify others in the room
            socket.to(studioId).emit('participant-left', {
                socketId: socket.id,
                timestamp: new Date().toISOString(),
            })
        })

        // Recording state change (host only)
        socket.on('recording-state', ({ studioId, isRecording }: { studioId: string; isRecording: boolean }) => {
            console.log(`🔴 Recording state changed in studio ${studioId}: ${isRecording}`)

            // Broadcast to everyone in the studio (including sender)
            io?.to(studioId).emit('recording-state', { isRecording, timestamp: new Date().toISOString() })
        })

        // Chunk upload progress (optional, for UI feedback)
        socket.on('chunk-uploaded', ({ studioId, participantId, chunkIndex }: {
            studioId: string
            participantId: string
            chunkIndex: number
        }) => {
            console.log(`📦 Chunk ${chunkIndex} uploaded for participant ${participantId} in studio ${studioId}`)

            // Notify host/dashboard
            socket.to(studioId).emit('chunk-uploaded', { participantId, chunkIndex })
        })

        // Chat message - broadcast to all in room
        socket.on('chat-message', ({ studioId, message }: {
            studioId: string
            message: { id: number; name: string; text: string; time: string; senderId: string }
        }) => {
            console.log(`💬 Chat message in studio ${studioId} from ${message.name}`)
            // Broadcast to everyone in the room (including sender for confirmation)
            io?.to(studioId).emit('chat-message', message)
        })

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`)
        })
    })

    console.log('✅ Socket.io server initialized with Redis adapter')

    return io
}

export function getSocketServer(): SocketIOServer | null {
    return io
}

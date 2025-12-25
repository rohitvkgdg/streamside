import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880'
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey'
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret'

// Convert WebSocket URL to HTTP URL for API calls
function getHttpUrl(wsUrl: string): string {
    return wsUrl.replace('ws://', 'http://').replace('wss://', 'https://')
}

/**
 * GET /api/studios/stats
 * Get studio stats including active rooms and participant counts from LiveKit
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        })

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user's studios (sorted by oldest first)
        const studios = await prisma.studio.findMany({
            where: {
                hostId: session.user.id,
            },
            select: {
                id: true,
                name: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'asc', // Oldest first
            },
        })

        // Initialize LiveKit Room Service client
        const httpUrl = getHttpUrl(LIVEKIT_URL)
        const roomService = new RoomServiceClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

        // Get stats for each studio
        const studiosWithStats = await Promise.all(
            studios.map(async (studio) => {
                let activeParticipants = 0
                let status: 'active' | 'idle' = 'idle'

                try {
                    // Try to get room participants from LiveKit
                    // Room names are formatted as "studio-{studioId}"
                    const liveKitRoomName = `studio-${studio.id}`
                    const participants = await roomService.listParticipants(liveKitRoomName)
                    activeParticipants = participants.length
                    status = participants.length > 0 ? 'active' : 'idle'
                } catch (error) {
                    // Room might not exist in LiveKit yet, that's ok
                    status = 'idle'
                    activeParticipants = 0
                }

                return {
                    id: studio.id,
                    name: studio.name,
                    status,
                    activeParticipants,
                    lastActive: formatLastActive(studio.updatedAt),
                }
            })
        )

        // Calculate aggregate stats
        const activeRooms = studiosWithStats.filter(s => s.status === 'active').length
        const totalParticipants = studiosWithStats.reduce((sum, s) => sum + s.activeParticipants, 0)

        return NextResponse.json({
            studios: studiosWithStats,
            stats: {
                activeRooms,
                totalParticipants,
                totalRooms: studios.length,
            },
        })
    } catch (error) {
        console.error('❌ Error fetching studio stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch studio stats' },
            { status: 500 }
        )
    }
}

function formatLastActive(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
}

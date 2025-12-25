import { NextRequest, NextResponse } from 'next/server'
import { generateLiveKitToken } from '@/lib/livekit'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/livekit-token
 * Generate a LiveKit access token for joining a studio
 * 
 * Supports both authenticated users and guests (via invite link)
 * 
 * Body:
 *  - roomName: string (studio ID)
 *  - participantIdentity: string (user ID or guest ID)
 *  - participantName: string (display name)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { roomName, participantIdentity, participantName } = body

        if (!roomName || !participantIdentity) {
            return NextResponse.json(
                { error: 'roomName and participantIdentity are required' },
                { status: 400 }
            )
        }

        // Check if this is a guest (identity starts with 'guest-')
        const isGuest = participantIdentity.startsWith('guest-')

        if (!isGuest) {
            // For non-guests, require authentication
            const session = await auth.api.getSession({
                headers: req.headers,
            })

            if (!session?.user) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }
        }

        // Extract studio ID from roomName (format: studio-{studioId})
        const studioId = roomName.startsWith('studio-') ? roomName.slice(7) : roomName

        // Verify the studio exists
        const studio = await prisma.studio.findUnique({
            where: { id: studioId },
            select: { id: true, isActive: true }
        })

        if (!studio) {
            return NextResponse.json(
                { error: 'Studio not found' },
                { status: 404 }
            )
        }

        if (!studio.isActive) {
            return NextResponse.json(
                { error: 'Studio is no longer active' },
                { status: 410 }
            )
        }

        const token = await generateLiveKitToken(
            roomName,
            participantIdentity,
            participantName || 'Anonymous'
        )

        return NextResponse.json({
            token,
            wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || 'ws://localhost:7880',
        })
    } catch (error) {
        console.error('❌ Error generating LiveKit token:', error)
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        )
    }
}

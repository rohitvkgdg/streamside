import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/studios
 * List all studios for the authenticated user
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

        const studios = await prisma.studio.findMany({
            where: {
                hostId: session.user.id,
            },
            select: {
                id: true,
                name: true,
                description: true,
                inviteCode: true,
                isActive: true,
                createdAt: true,
                recordings: {
                    select: {
                        id: true,
                        participantName: true,
                        status: true,
                        size: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json({ studios })
    } catch (error) {
        console.error('❌ Error fetching studios:', error)
        return NextResponse.json(
            { error: 'Failed to fetch studios' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/studios
 * Create a new studio
 * 
 * Supports both authenticated users and guests
 * 
 * Body:
 *  - name: string
 *  - description: string (optional)
 *  - guestId: string (optional, for guest users)
 *  - guestName: string (optional, for guest users)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, description, guestId, guestName } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Studio name is required' },
                { status: 400 }
            )
        }

        // Check if this is a guest request
        const isGuest = guestId && guestId.startsWith('guest-')

        let hostId: string | null = null

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
            hostId = session.user.id
        }

        // For guests, we need to create a temporary user or handle differently
        // Since hostId is required in the schema, we'll need to either:
        // 1. Create a guest user record, or
        // 2. Use a special "guest" user ID
        // For now, let's skip DB storage for guest meetings and return a virtual studio

        if (isGuest) {
            // For guests, create a virtual studio (not stored in DB)
            // Generate a random invite code for the guest
            const virtualStudio = {
                id: `guest-studio-${Math.random().toString(36).substring(2, 11)}`,
                name,
                description,
                inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
                isActive: true,
                createdAt: new Date().toISOString(),
                isGuest: true,
                guestName: guestName || 'Guest',
            }
            return NextResponse.json({ studio: virtualStudio }, { status: 201 })
        }

        // For authenticated users, create a real studio in the database
        const studio = await prisma.studio.create({
            data: {
                name,
                description,
                hostId: hostId!,
            },
        })

        return NextResponse.json({ studio }, { status: 201 })
    } catch (error) {
        console.error('❌ Error creating studio:', error)
        return NextResponse.json(
            { error: 'Failed to create studio' },
            { status: 500 }
        )
    }
}

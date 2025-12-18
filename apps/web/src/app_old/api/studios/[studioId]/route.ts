import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/studios/[studioId]
 * Get a single studio by ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ studioId: string }> }
) {
    try {
        const { studioId } = await params

        const studio = await prisma.studio.findUnique({
            where: { id: studioId },
            select: {
                id: true,
                name: true,
                description: true,
                inviteCode: true,
                hostId: true,
                isActive: true,
                createdAt: true,
                host: {
                    select: {
                        name: true,
                        email: true,
                    }
                },
                recordings: {
                    select: {
                        id: true,
                        participantName: true,
                        status: true,
                        size: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    }
                },
            },
        })

        if (!studio) {
            return NextResponse.json(
                { error: 'Studio not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ studio })
    } catch (error) {
        console.error('❌ Error fetching studio:', error)
        return NextResponse.json(
            { error: 'Failed to fetch studio' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/studios/[studioId]
 * Delete a studio (host only)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ studioId: string }> }
) {
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

        const { studioId } = await params

        // Check if user is the host
        const studio = await prisma.studio.findUnique({
            where: { id: studioId },
            select: { hostId: true },
        })

        if (!studio) {
            return NextResponse.json(
                { error: 'Studio not found' },
                { status: 404 }
            )
        }

        if (studio.hostId !== session.user.id) {
            return NextResponse.json(
                { error: 'Only the host can delete this studio' },
                { status: 403 }
            )
        }

        await prisma.studio.delete({
            where: { id: studioId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('❌ Error deleting studio:', error)
        return NextResponse.json(
            { error: 'Failed to delete studio' },
            { status: 500 }
        )
    }
}

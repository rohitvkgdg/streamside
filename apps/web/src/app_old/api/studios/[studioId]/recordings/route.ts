import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/studios/[studioId]/recordings
 * List all recordings for a studio
 * 
 * Note: Recordings are now saved locally on users' devices via the
 * File System Access API. This endpoint lists recording metadata only.
 */
export async function GET(
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

        // Verify user has access to this studio (is the host)
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
                { error: 'Only the host can view recordings' },
                { status: 403 }
            )
        }

        // Get all recordings for this studio
        const recordings = await prisma.recording.findMany({
            where: { studioId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                participantId: true,
                participantName: true,
                status: true,
                size: true,
                duration: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        // Format for response
        const formattedRecordings = recordings.map((recording) => ({
            ...recording,
            size: recording.size.toString(),
            // Note: downloadUrl is null since recordings are saved locally
            downloadUrl: null,
            localRecording: true,
        }))

        return NextResponse.json({ recordings: formattedRecordings })
    } catch (error) {
        console.error('❌ Error fetching recordings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recordings' },
            { status: 500 }
        )
    }
}

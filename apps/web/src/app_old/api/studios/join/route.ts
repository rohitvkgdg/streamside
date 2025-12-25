import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/studios/join
 * Look up a studio by its invite code
 * 
 * Body:
 *  - inviteCode: string
 * 
 * Returns studio ID and name if found, allowing guest to join
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { inviteCode } = body

        if (!inviteCode) {
            return NextResponse.json(
                { error: 'Invite code is required' },
                { status: 400 }
            )
        }

        const studio = await prisma.studio.findUnique({
            where: { inviteCode },
            select: {
                id: true,
                name: true,
                isActive: true,
                host: {
                    select: {
                        name: true,
                    }
                }
            }
        })

        if (!studio) {
            return NextResponse.json(
                { error: 'Studio not found. Please check your invite code.' },
                { status: 404 }
            )
        }

        if (!studio.isActive) {
            return NextResponse.json(
                { error: 'This studio is no longer active.' },
                { status: 410 }
            )
        }

        return NextResponse.json({
            studio: {
                id: studio.id,
                name: studio.name,
                hostName: studio.host?.name || 'Host',
            }
        })
    } catch (error) {
        console.error('❌ Error looking up studio:', error)
        return NextResponse.json(
            { error: 'Failed to look up studio' },
            { status: 500 }
        )
    }
}

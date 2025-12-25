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
 * Body:
 *  - name: string
 *  - description: string (optional)
 */
export async function POST(req: NextRequest) {
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

        const body = await req.json()
        const { name, description } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Studio name is required' },
                { status: 400 }
            )
        }

        const studio = await prisma.studio.create({
            data: {
                name,
                description,
                hostId: session.user.id,
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

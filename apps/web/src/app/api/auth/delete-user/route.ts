'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
    try {
        // Get the session from BetterAuth
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Delete user data in correct order (respecting foreign key constraints)
        // 1. Delete sessions first
        await prisma.session.deleteMany({
            where: { userId },
        });

        // 2. Delete accounts (OAuth connections)
        await prisma.account.deleteMany({
            where: { userId },
        });

        // 3. Delete studios created by user
        await prisma.studio.deleteMany({
            where: { hostId: userId },
        });

        // 4. Delete verifications
        await prisma.verification.deleteMany({
            where: { identifier: session.user.email || '' },
        });

        // 5. Finally delete the user
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}

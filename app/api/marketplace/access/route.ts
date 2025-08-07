import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { userDocumentAccess, documentLibrary } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, accessType = 'free' } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Check if document exists and is free
    const [document] = await db
      .select()
      .from(documentLibrary)
      .where(and(
        eq(documentLibrary.id, documentId),
        eq(documentLibrary.isActive, true)
      ))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // For free access, document must be free
    if (accessType === 'free' && !document.isFree) {
      return NextResponse.json({ error: 'Document requires payment' }, { status: 400 });
    }

    // Check if user already has access
    const [existingAccess] = await db
      .select()
      .from(userDocumentAccess)
      .where(and(
        eq(userDocumentAccess.userId, session.user.id),
        eq(userDocumentAccess.documentId, documentId)
      ))
      .limit(1);

    if (existingAccess) {
      return NextResponse.json({ message: 'Access already granted' });
    }

    // Grant access
    const [access] = await db
      .insert(userDocumentAccess)
      .values({
        userId: session.user.id,
        documentId,
        accessType: accessType as 'purchased' | 'free' | 'admin',
        downloadCount: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      access,
    });
  } catch (error) {
    console.error('Access grant error:', error);
    return NextResponse.json(
      { error: 'Failed to grant access' },
      { status: 500 }
    );
  }
}
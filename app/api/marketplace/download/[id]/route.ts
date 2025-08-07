import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess, downloadHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get document
    const [document] = await db
      .select()
      .from(documentLibrary)
      .where(and(
        eq(documentLibrary.id, id),
        eq(documentLibrary.isActive, true)
      ))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check user access
    const [access] = await db
      .select()
      .from(userDocumentAccess)
      .where(and(
        eq(userDocumentAccess.userId, session.user.id),
        eq(userDocumentAccess.documentId, id)
      ))
      .limit(1);

    // Admin users have access to all documents
    const hasAdminAccess = session.user.role === 'admin';

    if (!access && !hasAdminAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read and serve file
    const filePath = path.join(process.cwd(), 'public', document.filePath);
    const fileBuffer = await readFile(filePath);

    // Log download
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIP || 'unknown';

    if (access) {
      // Record download history
      await db.insert(downloadHistory).values({
        userId: session.user.id,
        documentId: id,
        accessId: access.id,
        ipAddress,
        userAgent,
      });

      // Update download count for user access
      await db
        .update(userDocumentAccess)
        .set({
          downloadCount: access.downloadCount + 1,
          lastAccessedAt: new Date(),
        })
        .where(eq(userDocumentAccess.id, access.id));
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', document.fileType);
    headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);
    headers.set('Content-Length', document.fileSize.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { documentLibrary } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin and paid users to create documents
    if (session.user.role !== 'admin' && session.user.role !== 'paiduser') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await req.json();

    // Validate required fields
    const {
      title,
      description,
      category,
      price,
      isFree,
      tags,
      fileName,
      filePath,
      fileSize,
      fileType,
      uploadedBy,
    } = data;

    if (!title || !fileName || !filePath || !fileSize || !fileType || !uploadedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify uploader matches session user
    if (uploadedBy !== session.user.id) {
      return NextResponse.json({ error: 'Invalid uploader' }, { status: 403 });
    }

    // Create document record
    const [document] = await db
      .insert(documentLibrary)
      .values({
        title,
        description: description || null,
        category: category || null,
        price: isFree ? '0.00' : price.toString(),
        isFree: Boolean(isFree),
        tags: Array.isArray(tags) ? tags : [],
        fileName,
        filePath,
        fileSize: parseInt(fileSize.toString()),
        fileType,
        uploadedBy,
        downloadCount: 0,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Document creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { cmsContent } from '@/lib/db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const active = searchParams.get('active') !== 'false';

  const conditions = [
    eq(cmsContent.userId, session.user.id),
    eq(cmsContent.isActive, active)
  ];
  
  if (type) {
    conditions.push(eq(cmsContent.type, type as any));
  }
  
  if (category) {
    conditions.push(eq(cmsContent.category, category));
  }
  
  if (search) {
    const searchCondition = or(
      ilike(cmsContent.title, `%${search}%`),
      ilike(cmsContent.content, `%${search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const content = await db
    .select()
    .from(cmsContent)
    .where(and(...conditions));
  return NextResponse.json(content);
}
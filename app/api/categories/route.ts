import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ userId: null }, { userId: user.id }],
      ...(type && { type: type as any }),
    },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(categories)
}

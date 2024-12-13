import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        categories: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(stories)
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, preview, content, categories } = await req.json()

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const story = await prisma.story.create({
      data: {
        title,
        preview,
        content,
        author: {
          connect: { id: user.id },
        },
        categories: {
          connectOrCreate: categories.map((category: string) => ({
            where: { name: category },
            create: { name: category },
          })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        categories: true,
      },
    })
    return NextResponse.json(story)
  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


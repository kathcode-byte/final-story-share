import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storyId = params.id
  const email = session.user.email;
  if (!email) {
    return NextResponse.json({ error: 'User email not found' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const userId = user.id

  try {
    // Check if the user has already liked the story
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ error: 'You have already liked this story' }, { status: 400 })
    }

    // Create a new like and increment the likesCount
    const [like, updatedStory] = await prisma.$transaction([
      prisma.like.create({
        data: {
          userId: userId,
          storyId: storyId,
        },
      }),
      prisma.story.update({
        where: { id: storyId },
        data: {
          likesCount: {
            increment: 1,
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
        },
      }),
    ])

    return NextResponse.json(updatedStory)
  } catch (error) {
    console.error('Error liking story:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


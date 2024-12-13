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
  const { content } = await req.json()

  if (!content || content.trim() === '') {
    return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
  }

  try {
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [comment, updatedStory] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          userId: user.id,
          storyId: storyId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      prisma.story.update({
        where: { id: storyId },
        data: {
          commentsCount: {
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
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
        },
      }),
    ])

    return NextResponse.json({ comment, story: updatedStory })
  } catch (error) {
    console.error('Error commenting on story:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


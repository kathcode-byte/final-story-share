import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const storyId = params.id

  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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
        },
        categories: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Add a publishedDate field if it doesn't exist
    const storyWithPublishedDate = {
      ...story,
      publishedDate: story.createdAt,
    }

    return NextResponse.json(storyWithPublishedDate)
  } catch (error) {
    console.error('Error fetching story:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


'use client'

import { useState, useEffect } from "react"
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Search, Heart, MessageCircle, Share2, User, TrendingUp, Menu, Filter, PlusCircle, Moon, Sun, ChevronLeft, ChevronRight, Eye, ArrowLeft, LogOut, Edit } from 'lucide-react'

function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return <>{children}</>
}

interface Story {
  id: string;
  title: string;
  preview: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
  };
  likesCount: number;
  commentsCount: number;
  comments?: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      username: string;
    };
    createdAt: string;
  }[];
  views: number;
  publishedDate: string;
  categories: string[];
}

const categories = [
  "Cheating", "Mother", "Incest", "Netorare", "Cheating", "Drama",
  "Fiction", "Gangbang", "Bestfriend", "Girlfriend", "Aunt", "Sister",
]

const trendingTopics = [
  "Cheating", "Fiction", "Gangbang", "Incest", "Aunt",
]

function StoryShareWebsite() {
  const { data: session, status } = useSession()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isNewStoryOpen, setIsNewStoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const storiesPerPage = 10
  const totalPages = Math.ceil(stories.length / storiesPerPage)

  useEffect(() => {
    fetchStories()
  }, [status])

  const fetchStories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stories')
      if (!response.ok) {
        throw new Error('Failed to fetch stories')
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setStories(data)
      } else {
        console.error('Fetched data is not an array:', data)
        setStories([])
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
      setStories([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleReadStory = async (story: Story) => {
    try {
      const response = await fetch(`/api/stories/${story.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch story details')
      }
      const fullStory = await response.json()
      setSelectedStory(fullStory)
    } catch (error) {
      console.error('Error fetching story details:', error)
      alert('Failed to load story details')
    }
  }

  const handleCloseStory = () => {
    setSelectedStory(null)
  }

  const handleLike = async (storyId: string) => {
    if (!session) {
      alert('Please sign in to like stories')
      return
    }

    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to like story')
      }
      const updatedStory: Story = await response.json()
      setStories(stories.map(story => story.id === updatedStory.id ? updatedStory : story))
      if (selectedStory && selectedStory.id === updatedStory.id) {
        setSelectedStory(updatedStory)
      }
    } catch (error) {
      console.error('Error liking story:', error)
      alert(error instanceof Error ? error.message : 'An error occurred while liking the story')
    }
  }

  const handleAuthOpen = () => {
    setIsAuthOpen(true)
    setAuthError(null)
  }

  const handleAuthClose = () => {
    setIsAuthOpen(false)
    setAuthError(null)
  }

  const handleShare = (story: Story) => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.preview,
        url: `${window.location.origin}/story/${story.id}`,
      }).then(() => {
        console.log('Successful share')
      }).catch((error) => {
        console.log('Error sharing', error)
      })
    } else {
      console.log('Web Share API not supported')
      navigator.clipboard.writeText(`${window.location.origin}/story/${story.id}`).then(() => {
        alert('Link copied to clipboard!')
      }).catch((err) => {
        console.error('Failed to copy: ', err)
      })
    }
  }

  const handleAddNewStory = async (newStory: Omit<Story, 'id' | 'author' | 'likesCount' | 'commentsCount' | 'views' | 'publishedDate'>) => {
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStory),
      })
      const addedStory: Story = await response.json()
      setStories([addedStory, ...stories])
      setIsNewStoryOpen(false)
    } catch (error) {
      console.error('Error adding new story:', error)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError(null)
    const formData = new FormData(e.currentTarget)
    const userData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      username: formData.get('username') as string
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('User created successfully:', data)
        const result = await signIn('credentials', { 
          email: userData.email, 
          password: userData.password,
          redirect: false
        })
        if (result?.error) {
          setAuthError(result.error)
        } else {
          handleAuthClose()
          // window.location.reload()
        }
      } else {
        const error = await response.json()
        console.error('Error creating user:', error)
        setAuthError(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    }
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError(null)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        console.error('Error logging in:', result.error)
        setAuthError(result.error)
      } else {
        handleAuthClose()
        // window.location.reload()
      }
    } catch (error) {
      console.error('Unexpected error during login:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    }
  }

  const handleEditStory = (story: Story) => {
    setEditingStory(story)
  }

  const handleUpdateStory = async (updatedStory: Story) => {
    try {
      const response = await fetch(`/api/stories/${updatedStory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStory),
      })
      const updated: Story = await response.json()
      setStories(stories.map(story => story.id === updated.id ? updated : story))
      setEditingStory(null)
    } catch (error) {
      console.error('Error updating story:', error)
    }
  }

  const handleComment = async (storyId: string, content: string) => {
    if (!session) {
      alert('Please sign in to comment on stories');
      return;
    }

    try {
      const response = await fetch(`/api/stories/${storyId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        const { comment, story } = await response.json();
        setStories(stories.map(s => s.id === story.id ? story : s));
        if (selectedStory && selectedStory.id === story.id) {
          setSelectedStory(story);
        }
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error commenting on story:', error);
      alert('An error occurred while adding the comment');
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      handleAuthClose()
      fetchStories()
    }
  }, [status])

  return (
    <div className={`flex flex-col min-h-screen bg-background ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
                  Home
                </Link>
                {status === "authenticated" ? (
                  <Button variant="link" className="text-sm font-medium" onClick={() => signOut()}>
                    Log Out
                  </Button>
                ) : (
                  <>
                    <Button variant="link" className="text-sm font-medium" onClick={handleAuthOpen}>
                      Sign In
                    </Button>
                    <Button variant="link" className="text-sm font-medium" onClick={handleAuthOpen}>
                      Sign Up
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Link className="flex items-center justify-center ml-4 md:ml-0" href="#">
            <BookOpen className="h-6 w-6 mr-2" />
            <span className="font-bold">LusTales</span>
          </Link>
          <nav className="mx-6 flex items-center space-x-4 lg:space-x-6 hidden md:block">
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
              Home
            </Link>
            {status === "authenticated" ? (
              <Button variant="link" className="text-sm font-medium" onClick={() => signOut()}>
                Log Out
              </Button>
            ) : (
              <>
                <Button variant="link" className="text-sm font-medium" onClick={handleAuthOpen}>
                  Sign In
                </Button>
                <Button variant="link" className="text-sm font-medium" onClick={handleAuthOpen}>
                  Sign Up
                </Button>
              </>
            )}
          </nav>
          <div className="flex items-center ml-auto space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                {status === "authenticated" ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt={session?.user?.name || 'User'} />
                        <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-bold">{session?.user?.name}</h2>
                        <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Dashboard</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stories.filter(story => story.author.id === (session.user as { id: string }).id).length}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {stories.filter(story => story.author.id === (session.user as { id: string }).id).reduce((total, story) => total + story.likesCount, 0)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Published Stories</h3>
                      <ScrollArea className="h-[200px]">
                        {session?.user && stories.filter(story => story.author.id === (session.user as { id: string }).id).map((story) => (
                          <Card key={story.id} className="mb-4">
                            <CardHeader>
                              <CardTitle className="text-base">{story.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{story.preview}</p>
                            </CardContent>
                            <CardFooter>
                              <Button variant="ghost" size="sm">
                                <Heart className="mr-2 h-4 w-4" />
                                {story.likesCount}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                {story.commentsCount}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </ScrollArea>
                    </div>
                    <div className="space-y-4">
                      <Button className="w-full" onClick={() => setIsNewStoryOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Story
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">Welcome to LusTales</h2>
                    <p>Please sign in or create an account to access your profile and start sharing stories.</p>
                    <Button className="w-full" onClick={handleAuthOpen}>Sign In / Sign Up</Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading stories...</p>
          </div>
        ) : selectedStory ? (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-card text-card-foreground shadow-lg rounded-lg max-w-4xl w-full mx-4 my-8">
              <div className="p-6 md:p-8 space-y-6">
                <Button variant="ghost" size="sm" onClick={handleCloseStory} className="absolute top-4 left-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Stories
                </Button>
                <article className="prose dark:prose-invert lg:prose-xl max-w-none">
                  <h1 className="mb-4 text-3xl font-bold">{selectedStory.title}</h1>
                  <div className="flex items-center text-sm text-muted-foreground mb-8">
                    <span>By {selectedStory.author.name}</span>
                    <Separator className="mx-2 h-4" orientation="vertical" />
                    <span>Published on {new Date(selectedStory.publishedDate).toLocaleDateString()}</span>
                  </div>
                  {selectedStory.content.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </article>
                <div className="flex justify-between items-center mt-8 pt-4 border-t">
                  <div className="flex space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleLike(selectedStory.id)}
                      disabled={!session}
                    >
                      <Heart className={`mr-2 h-4 w-4 ${selectedStory.likesCount > 0 ? 'fill-current text-red-500' : ''}`} />
                      {selectedStory.likesCount}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {selectedStory.commentsCount}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      {selectedStory.views}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleShare(selectedStory)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
                {session && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const content = form.comment.value;
                    if (content.trim()) {
                      handleComment(selectedStory.id, content);
                      form.reset();
                    }
                  }} className="mt-4">
                    <Textarea name="comment" placeholder="Add a comment..." className="mb-2" />
                    <Button type="submit">Post Comment</Button>
                  </form>
                )}
                {selectedStory.comments && selectedStory.comments.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Comments</h3>
                    {selectedStory.comments.map((comment) => (
                      <div key={comment.id} className="bg-muted p-3 rounded-lg mb-2">
                        <p className="font-semibold">{comment.user.name}</p>
                        <p>{comment.content}</p>
                        <p className="text-sm text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="container flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 order-3 lg:order-1">
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px] lg:h-[calc(100vh-250px)]">
                    <div className="p-4">
                      {categories.map((category, i) => (
                        <div key={category}>
                          <Link
                            className="block py-2 text-sm hover:underline"
                            href={`#${category.toLowerCase().replace(" ", "-")}`}
                          >
                            {category}
                          </Link>
                          {i < categories.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </aside>

            {/* Story list */}
            <div className="flex-1 space-y-6 order-1 lg:order-2">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search stories" className="pl-8" />
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <ScrollArea className="h-[calc(100vh-100px)]">
                      <div className="space-y-6 p-2">
                        <div>
                          <h3 className="mb-2 text-lg font-semibold">Sort By</h3>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newest">Newest</SelectItem>
                              <SelectItem value="popular">Most Popular</SelectItem>
                              <SelectItem value="comments">Most Comments</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <h3 className="mb-2 text-lg font-semibold">Category</h3>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category.toLowerCase()}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <h3 className="mb-2 text-lg font-semibold">Length</h3>
                          <Slider
                            defaultValue={[0, 100]}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between mt-2">
                            <span className="text-sm">Short</span>
                            <span className="text-sm">Long</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="completed" />
                          <Label htmlFor="completed">Completed stories only</Label>
                        </div>
                        <Button className="w-full">Apply Filters</Button>
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
              <h2 className="text-2xl font-bold">Featured Stories</h2>
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-6 pr-4">
                  {stories.map((story) => (
                    <Card key={story.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => handleReadStory(story)}>
                      <CardHeader>
                        <div>
                          <CardTitle>{story.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">by {story.author.name}</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{story.preview}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="flex space-x-4">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleLike(story.id); }}>
                            <Heart className="mr-2 h-4 w-4" />
                            {story.likesCount}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {story.commentsCount}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            {story.views}
                          </Button>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleShare(story); }}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                          {session && story.author.id === (session.user as { id: string }).id && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditStory(story); }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Trending topics */}
            <aside className="w-full lg:w-64 order-2 lg:order-3">
              <Card>
                <CardHeader>
                  <CardTitle>Trending Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {trendingTopics.map((topic, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Advertisement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted h-40 flex items-center justify-center text-muted-foreground">
                    Ad Space
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex flex-col sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
          <p className="text-xs text-muted-foreground">© 2024 LusTales. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Terms of Service
            </Link>
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>

      {/* Sign In / Sign Up Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={handleAuthClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Welcome to LusTales</DialogTitle>
            <DialogDescription>
              Sign in to your account or create a new one to start sharing your stories.
            </DialogDescription>
          </DialogHeader>
          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{authError}</span>
            </div>
          )}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                </div>
                <Button type="submit" className="w-full">Sign In</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" placeholder="johndoe" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div className="grid gap-2">
<div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                  </div>
                </div>
                <Button type="submit" className="w-full">Sign Up</Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add New Story Dialog */}
      <Dialog open={isNewStoryOpen} onOpenChange={setIsNewStoryOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Story</DialogTitle>
            <DialogDescription>Create a new story to share with the community.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newStory = {
              title: formData.get('title') as string,
              preview: formData.get('preview') as string,
              content: formData.get('content') as string,
              categories: [formData.get('category') as string],
            };
            handleAddNewStory(newStory);
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Enter your story title" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preview">Preview</Label>
                <Textarea id="preview" name="preview" placeholder="Write a short preview of your story..." required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Story Content</Label>
                <Textarea id="content" name="content" placeholder="Write your story here..." className="h-[200px]" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Publish Story</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Story Dialog */}
      <Dialog open={!!editingStory} onOpenChange={() => setEditingStory(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
            <DialogDescription>Make changes to your story.</DialogDescription>
          </DialogHeader>
          {editingStory && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedStory = {
                ...editingStory,
                title: formData.get('title') as string,
                preview: formData.get('preview') as string,
                content: formData.get('content') as string,
                category: formData.get('category') as string,
              };
              handleUpdateStory(updatedStory);
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" name="title" defaultValue={editingStory.title} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select name="category" defaultValue={editingStory.categories[0]} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-preview">Preview</Label>
                  <Textarea id="edit-preview" name="preview" defaultValue={editingStory.preview} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Story Content</Label>
                  <Textarea id="edit-content" name="content" defaultValue={editingStory.content} className="h-[200px]" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Story</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StoryShareWebsiteWrapper() {
  return (
    <SessionProvider>
      <ClientWrapper>
        <StoryShareWebsite />
      </ClientWrapper>
    </SessionProvider>
  )
}


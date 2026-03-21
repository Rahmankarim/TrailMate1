"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Trash2, Edit, Eye, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Story {
  id: string
  title: string
  excerpt: string
  coverImage: string
  publishedDate: string
  isPublished: boolean
}

export default function GuideStoriesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newStory, setNewStory] = useState({
    title: "",
    content: "",
    coverImage: "",
  })

  useEffect(() => {
    if (user?._id) {
      fetchStories()
    }
  }, [user])

  const fetchStories = async () => {
    try {
      const response = await fetch(`/api/stories?guideId=${user?._id}`)
      if (response.ok) {
        const data = await response.json()
        setStories(data.stories.map((s: any) => ({
          ...s,
          id: s._id || s.id
        })))
      }
    } catch (error) {
      console.error("Error fetching stories:", error)
    }
  }

  const handleCreateStory = async () => {
    if (!newStory.title || !newStory.content) {
      toast({
        title: "Error",
        description: "Please fill in title and content",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guideId: user?._id,
          guideName: `${user?.firstName} ${user?.lastName}`,
          guideAvatar: user?.avatar,
          title: newStory.title,
          content: newStory.content,
          coverImage: newStory.coverImage,
          isPublished: true,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your story has been published",
        })
        setIsCreating(false)
        setNewStory({ title: "", content: "", coverImage: "" })
        fetchStories()
      } else {
        toast({
          title: "Error",
          description: "Failed to publish story",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating story:", error)
      toast({
        title: "Error",
        description: "Failed to publish story",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Story deleted successfully",
        })
        fetchStories()
      }
    } catch (error) {
      console.error("Error deleting story:", error)
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="guide" user={user ? { name: user.firstName + ' ' + user.lastName, email: user.email, avatar: user.avatar } : undefined} />
      
      <div className="flex-1 ml-64">
        <DashboardTopbar title="Stories" />
        
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Stories</CardDescription>
                <CardTitle className="text-3xl">{stories.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Published</CardDescription>
                <CardTitle className="text-3xl text-green-500">
                  {stories.filter((s) => s.isPublished).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Drafts</CardDescription>
                <CardTitle className="text-3xl text-yellow-500">
                  {stories.filter((s) => !s.isPublished).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Create Story Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Story</CardTitle>
                <CardDescription>Share your travel experiences and adventures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Story Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter story title..."
                    value={newStory.title}
                    onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    placeholder="https://example.com/image.jpg"
                    value={newStory.coverImage}
                    onChange={(e) => setNewStory({ ...newStory, coverImage: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Story Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your story..."
                    rows={10}
                    value={newStory.content}
                    onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleCreateStory} 
                    className="cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? "Publishing..." : "Publish Story"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreating(false)} 
                    className="cursor-pointer"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          {!isCreating && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Stories</CardTitle>
                    <CardDescription>Share your adventures with the world</CardDescription>
                  </div>
                  <Button onClick={() => setIsCreating(true)} className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Story
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Stories List */}
          {!isCreating && (
            <Card>
              <CardContent className="p-6">
                {stories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stories yet</p>
                    <p className="text-sm mt-2">Share your travel experiences and inspire others</p>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(true)}
                      className="mt-4 cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Story
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                      <div
                        key={story.id}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-video bg-muted relative">
                          {story.coverImage && (
                            <img
                              src={story.coverImage}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <Badge
                            className={`absolute top-2 right-2 ${
                              story.isPublished ? "bg-green-500" : "bg-yellow-500"
                            }`}
                          >
                            {story.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="p-4 space-y-3">
                          <h3 className="font-semibold line-clamp-2">{story.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {story.excerpt}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(story.publishedDate).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 cursor-pointer"
                              onClick={() => router.push(`/stories/${story.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="cursor-pointer"
                              onClick={() => handleDeleteStory(story.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

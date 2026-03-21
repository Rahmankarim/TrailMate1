"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Loader2 } from "lucide-react"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"

interface Story {
  id: string
  guideId: string
  guideName: string
  guideAvatar?: string
  title: string
  content: string
  coverImage?: string
  publishedDate: string
}

export default function StoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStory() {
      try {
        const res = await fetch(`/api/stories/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setStory(data.story)
        } else {
          setStory(null)
        }
      } catch (err) {
        console.error("Error fetching story:", err)
        setStory(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchStory()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  if (!story) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">Story Not Found</h1>
          <p className="text-muted-foreground">The story you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/guides")} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guides
          </Button>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Cover Image */}
          {story.coverImage && (
            <div className="aspect-video w-full rounded-lg overflow-hidden mb-8">
              <img
                src={story.coverImage}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Story Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{story.title}</h1>
            
            {/* Author Info */}
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={story.guideAvatar} alt={story.guideName} />
                  <AvatarFallback>
                    {story.guideName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground cursor-pointer hover:underline" onClick={() => router.push(`/guides/${story.guideId}`)}>
                    {story.guideName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {new Date(story.publishedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Story Content */}
          <Card className="p-8">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {story.content}
            </div>
          </Card>

          {/* Author Card */}
          <Card className="mt-8 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={story.guideAvatar} alt={story.guideName} />
                <AvatarFallback>
                  {story.guideName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg">Written by {story.guideName}</p>
                <p className="text-sm text-muted-foreground">Professional Travel Guide</p>
              </div>
              <Button 
                onClick={() => router.push(`/guides/${story.guideId}`)}
                className="cursor-pointer"
              >
                View Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  )
}

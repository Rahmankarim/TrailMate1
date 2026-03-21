import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Search, ArrowRight, BookOpen, MapPin, Star } from "lucide-react"
import Link from "next/link"
import { blogPosts, getFeaturedPost, getAllCategories } from "@/lib/data/blogs"
import { getCollection } from "@/lib/db/mongodb"

async function fetchGuideStories() {
  try {
    const storiesCollection = await getCollection("stories")
    const stories = await storiesCollection
      .find({ isPublished: true })
      .sort({ publishedDate: -1 })
      .limit(6)
      .toArray()
    return stories.map((s: any) => ({
      _id: s._id.toString(),
      guideId: s.guideId,
      guideName: s.guideName || "Guide",
      guideAvatar: s.guideAvatar || "",
      title: s.title,
      excerpt: s.excerpt || s.content?.substring(0, 150) + "...",
      coverImage: s.coverImage || "",
      publishedDate: s.publishedDate,
    }))
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const featuredPost = getFeaturedPost()
  const categories = getAllCategories()
  const regularPosts = blogPosts.filter((post) => !post.featured)
  const guideStories = await fetchGuideStories()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Adventure Stories & Tips
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Expert advice, inspiring stories, and practical guides for your next adventure
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search articles..." className="pl-12 h-12 bg-card" />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
                className={category === "All" ? "bg-foreground text-background" : "bg-transparent"}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <Link href={`/blog/${featuredPost.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative h-64 lg:h-auto overflow-hidden">
                    <img
                      src={featuredPost.image || "/placeholder.svg"}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <Badge className="absolute top-4 left-4 bg-foreground text-background">Featured</Badge>
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-4">
                      {featuredPost.category}
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-foreground/80 transition-colors text-balance">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-6 text-pretty">{featuredPost.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={featuredPost.author.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {featuredPost.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{featuredPost.author.name}</p>
                          <p className="text-xs text-muted-foreground">{featuredPost.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Latest Articles</h2>
            <Button variant="outline" className="bg-transparent">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <Badge variant="secondary" className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm">
                      {post.category}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {post.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{post.author.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guide Stories Section */}
      {guideStories.length > 0 && (
        <section className="py-12 px-6 bg-secondary/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-2xl font-bold text-foreground">Stories from Our Guides</h2>
                </div>
                <p className="text-muted-foreground text-sm">Real experiences shared by TrailMate's certified guides</p>
              </div>
              <Button variant="outline" className="bg-transparent" asChild>
                <Link href="/stories">
                  View All Stories
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {guideStories.map((story) => (
                <Link href={`/stories/${story._id}`} key={story._id} className="group">
                  <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full">
                    <div className="relative h-48 overflow-hidden">
                      {story.coverImage ? (
                        <img
                          src={story.coverImage}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                      <Badge className="absolute top-4 left-4 bg-yellow-500/90 text-yellow-950 backdrop-blur-sm">
                        Guide Story
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{story.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={story.guideAvatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {story.guideName
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{story.guideName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {story.publishedDate
                            ? new Date(story.publishedDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-16 px-6 bg-secondary">
        <div className="max-w-2xl mx-auto text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
            Never Miss an Adventure Story
          </h2>
          <p className="text-muted-foreground mb-6 text-pretty">
            Subscribe to our newsletter for the latest articles, travel tips, and exclusive guides
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="h-12 bg-card" />
            <Button className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

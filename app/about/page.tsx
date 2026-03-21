import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mountain, Heart, Globe, Users, Award, Leaf, Target, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

const stats = [
  { value: "50+", label: "Destinations", icon: Globe },
  { value: "1,247", label: "Happy Travelers", icon: Users },
  { value: "120+", label: "Expert Guides", icon: Award },
  { value: "98%", label: "Satisfaction Rate", icon: Heart },
]

const values = [
  {
    icon: Leaf,
    title: "Sustainability First",
    description: "We're committed to eco-friendly travel that preserves natural beauty for future generations.",
  },
  {
    icon: Users,
    title: "Community Impact",
    description: "Supporting local communities and ensuring tourism benefits those who call these places home.",
  },
  {
    icon: Shield,
    title: "Safety & Trust",
    description: "All guides are verified and trained. Your safety is our top priority on every adventure.",
  },
  {
    icon: Target,
    title: "Authentic Experiences",
    description: "We curate genuine cultural immersions that go beyond typical tourist experiences.",
  },
]

const team = [
  {
    name: "Rahman Karim",
    role: "Founder & CEO",
    avatar: "/rahmankarim.jpeg?height=200&width=200",
    bio: "Born in Hunza, passionate about sustainable tourism",
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-foreground text-background">Our Story</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
                Connecting Adventurers with Authentic Experiences
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
                TrailMate was born from a simple idea: make adventure travel more sustainable, accessible, and
                meaningful. We connect travelers with local guides who know the hidden paths, secret viewpoints, and
                authentic stories that make every journey unforgettable.
              </p>
              <Link href="/destinations">
                <Button className="bg-foreground text-background hover:bg-foreground/90">
                  Start Your Adventure
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img
                src="/mountain-adventure-team-hiking.jpg"
                alt="TrailMate team on adventure"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <Mountain className="h-10 w-10 text-foreground" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">Since 2020</p>
                    <p className="text-muted-foreground">Making memories</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <stat.icon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Our Mission</h2>
          <p className="text-xl text-background/80 leading-relaxed text-pretty">
            To revolutionize adventure travel by creating meaningful connections between travelers and local guides,
            while promoting sustainable tourism that benefits communities and preserves the natural wonders of Pakistan
            and beyond.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">What We Stand For</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Our core values guide every decision we make and every adventure we create
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 text-center"
              >
                <CardContent className="p-0">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Passionate adventurers dedicated to making your journey extraordinary
            </p>
          </div>
          <div className="flex justify-center">
            <div className="max-w-md w-full">
              {team.map((member, index) => (
                <a
                  key={index}
                  href="https://rahman-karim.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-2 hover:border-foreground/20 cursor-pointer group">
                    <div className="relative">
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={member.avatar || "/placeholder.svg"}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-foreground text-background shadow-lg">
                          <Award className="h-3 w-3 mr-1" />
                          Founder
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-8 text-center">
                      <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-foreground/80 transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-base text-muted-foreground font-medium mb-3">{member.role}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{member.bio}</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                        <span>View Portfolio</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-balance">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Join thousands of travelers who have discovered the magic of Pakistan with TrailMate
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/destinations">
              <Button className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3">
                Explore Destinations
              </Button>
            </Link>
            <Link href="/guides">
              <Button variant="outline" className="px-8 py-3 bg-transparent">
                Find a Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

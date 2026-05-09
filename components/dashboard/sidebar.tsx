"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import {
  Mountain,
  LayoutDashboard,
  Calendar,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageCircle,
  FileText,
  DollarSign,
  Users,
  BarChart3,
  Building2,
  Shield,
  Compass,
  Star,
  User,
  Briefcase,
} from "lucide-react"

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

interface SidebarProps {
  role: "user" | "guide" | "company" | "admin"
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

const navItems: Record<string, NavItem[]> = {
  user: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/user" },
    { icon: Calendar, label: "My Bookings", href: "/dashboard/user/bookings" },
    { icon: Briefcase, label: "Guide Hiring", href: "/dashboard/user/guide-hiring" },
    { icon: Heart, label: "Saved", href: "/dashboard/user/saved" },
    { icon: Star, label: "My Reviews", href: "/dashboard/user/reviews" },
    { icon: MapPin, label: "Explore", href: "/destinations" },
    { icon: MessageCircle, label: "Messages", href: "/dashboard/user/messages" },
    { icon: Bell, label: "Notifications", href: "/dashboard/user/notifications" },
    { icon: User, label: "Profile", href: "/dashboard/user/profile" },
  ],
  guide: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/guide" },
    { icon: Calendar, label: "Bookings", href: "/dashboard/guide/bookings" },
    { icon: Compass, label: "My Tours", href: "/dashboard/guide/tours" },
    { icon: FileText, label: "Stories", href: "/dashboard/guide/stories" },
    { icon: Star, label: "Reviews", href: "/dashboard/guide/reviews" },
    { icon: DollarSign, label: "Earnings", href: "/dashboard/guide/earnings" },
    { icon: MessageCircle, label: "Messages", href: "/dashboard/guide/messages" },
    { icon: User, label: "Profile", href: "/dashboard/guide/profile" },
  ],
  company: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/company" },
    { icon: Calendar, label: "Bookings", href: "/dashboard/company/bookings" },
    { icon: Briefcase, label: "Guide Hiring", href: "/dashboard/company/guide-hiring" },
    { icon: Compass, label: "Tours", href: "/dashboard/company/tours" },
    { icon: Users, label: "Team", href: "/dashboard/company/team" },
    { icon: MessageCircle, label: "Messages", href: "/dashboard/company/messages" },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/company/analytics" },
    { icon: DollarSign, label: "Revenue", href: "/dashboard/company/revenue" },
    { icon: User, label: "Profile", href: "/dashboard/company/profile" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/admin" },
    { icon: Users, label: "Users", href: "/dashboard/admin/users" },
    { icon: Building2, label: "Companies", href: "/dashboard/admin/companies" },
    { icon: MapPin, label: "Destinations", href: "/dashboard/admin/destinations" },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/admin/analytics" },
    { icon: Shield, label: "Moderation", href: "/dashboard/admin/moderation" },
    { icon: User, label: "Profile", href: "/dashboard/admin/profile" },
  ],
}

export default function DashboardSidebar({ role, user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { signOut } = useAuth()
  const isAdmin = role === "admin"

  const items = navItems[role] || navItems.user
  const defaultUser = user || { name: "User", email: "user@example.com" }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col transition-all duration-300 z-40 ${
        isAdmin
          ? "bg-slate-950/95 text-slate-50 border-r border-slate-800 shadow-[0_0_40px_rgba(15,23,42,0.45)]"
          : "bg-card border-r border-border"
      } ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className={`p-4 flex items-center justify-between ${isAdmin ? "border-b border-slate-800" : "border-b border-border"}`}>
        <Link href="/" className={`flex items-center gap-2 cursor-pointer ${isCollapsed ? "justify-center" : ""}`}>
          <Mountain className={`h-8 w-8 flex-shrink-0 ${isAdmin ? "text-sky-300" : "text-foreground"}`} />
          {!isCollapsed && (
            <div className="leading-tight">
              <span className={`block text-xl font-bold ${isAdmin ? "text-slate-50" : "text-foreground"}`}>TrailMate</span>
              {isAdmin && <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin Console</span>}
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={
            isCollapsed
              ? `absolute -right-3 top-6 rounded-full shadow-md ${isAdmin ? "bg-slate-900 border border-slate-700 text-slate-50" : "bg-card border border-border"}`
              : ""
          }
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 p-4 space-y-2 overflow-y-auto ${isAdmin ? "text-slate-100" : ""}`}>
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 cursor-pointer ${isCollapsed ? "px-3" : ""} ${
                  isActive
                    ? isAdmin
                      ? "bg-sky-500/15 text-sky-100 hover:bg-sky-500/20"
                      : "bg-secondary"
                    : isAdmin
                      ? "text-slate-300 hover:bg-slate-900 hover:text-slate-50"
                      : ""
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className={`p-4 space-y-2 ${isAdmin ? "border-t border-slate-800" : "border-t border-border"}`}>
        <Link href={`/dashboard/${role}/settings`}>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 cursor-pointer ${isCollapsed ? "px-3" : ""} ${
              isAdmin ? "text-slate-300 hover:bg-slate-900 hover:text-slate-50" : ""
            }`}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Button>
        </Link>

        {/* User Info */}
        <div className={`flex items-center gap-3 p-2 rounded-lg ${isAdmin ? "bg-slate-900/80" : "bg-secondary"} ${isCollapsed ? "justify-center" : ""}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={defaultUser.avatar || "/placeholder.svg"} />
            <AvatarFallback>
              {defaultUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isAdmin ? "text-slate-50" : "text-foreground"}`}>{defaultUser.name}</p>
              <p className={`text-xs truncate ${isAdmin ? "text-slate-400" : "text-muted-foreground"}`}>{defaultUser.email}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start gap-3 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 ${isCollapsed ? "px-3" : ""}`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  )
}

"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Navbar from "./navbar"
import Footer from "./footer"

const dashboardPaths = ["/dashboard", "/admin"]
const authPaths = ["/signin", "/signup", "/auth"]

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isDashboard = dashboardPaths.some((path) => pathname.startsWith(path))
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path))

  if (isDashboard || isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

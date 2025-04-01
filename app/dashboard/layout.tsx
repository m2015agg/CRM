"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings, Database, BarChart, Briefcase, ClipboardList, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, session, isLoading, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if we're sure there's no session
    if (!isLoading && !session) {
      console.log("Dashboard layout: No session found, redirecting to login")

      // Use replace instead of push to avoid navigation history issues
      router.replace("/login")
    }

    // Add cleanup function
    return () => {
      // Reset any global state that might be causing issues
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = ""
        document.body.style.overflow = ""
      }
    }
  }, [session, isLoading, router])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      // The redirect is handled in the signOut function
    } catch (error) {
      console.error("Error signing out:", error)
      setIsSigningOut(false)
    }
  }

  // Show loading state while checking authentication or signing out
  if (isLoading || isSigningOut) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">{isSigningOut ? "Signing out..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  // If no session, render nothing (redirect will happen)
  if (!session) {
    return null
  }

  // Get user display name and avatar
  const displayName = user?.full_name || user?.email || "User"
  const avatarUrl = user?.avatar_url || ""
  const isAdmin = user?.role === "admin"

  // Define navigation items based on user role
  const navItems = isAdmin
    ? [
        {
          href: "/dashboard/admin",
          label: "Dashboard",
          icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
          active: pathname === "/dashboard/admin",
        },
        {
          href: "/dashboard/admin/opportunities",
          label: "Team Opportunities",
          icon: <BarChart className="mr-2 h-4 w-4" />,
          active: pathname.includes("/opportunities"),
        },
        {
          href: "/dashboard/admin/call-logs",
          label: "Team Call Logs",
          icon: <ClipboardList className="mr-2 h-4 w-4" />,
          active: pathname.includes("/call-logs"),
        },
        {
          href: "/dashboard/admin/console",
          label: "Administrator Console",
          icon: <Settings className="mr-2 h-4 w-4" />,
          active: pathname.includes("/console"),
        },
      ]
    : [
        {
          href: "/dashboard/submitter",
          label: "Weekly Overview",
          icon: <BarChart className="mr-2 h-4 w-4" />,
          active: pathname === "/dashboard/submitter",
        },
        {
          href: "/dashboard/submitter/opportunities",
          label: "Opportunities",
          icon: <Briefcase className="mr-2 h-4 w-4" />,
          active: pathname.includes("/opportunities"),
        },
      ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{isAdmin ? "Admin Dashboard" : "EQUIPCRM"}</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/setup">
                      <Database className="mr-2 h-4 w-4" />
                      <span>Storage Setup</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}


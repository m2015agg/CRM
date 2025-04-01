"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const { user, isAdmin } = useUser()

  // Common links for all users
  const commonLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/opportunities",
      label: "Opportunities",
      active: pathname === "/opportunities",
    },
    {
      href: "/kanban",
      label: "Kanban",
      active: pathname === "/kanban",
    },
    {
      href: "/call-log",
      label: "Call Log",
      active: pathname === "/call-log",
    },
  ]

  // Admin-only links
  const adminLinks = [
    {
      href: "/admin",
      label: "Admin",
      active: pathname === "/admin",
    },
    {
      href: "/admin/team-opps",
      label: "Team Opps",
      active: pathname === "/admin/team-opps",
    },
    {
      href: "/admin/team-kanban",
      label: "Team Kanban",
      active: pathname === "/admin/team-kanban",
    },
    {
      href: "/admin/team-calls",
      label: "Team Calls",
      active: pathname === "/admin/team-calls",
    },
  ]

  // Combine links based on user role
  const links = isAdmin ? [...commonLinks, ...adminLinks] : commonLinks

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            link.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}


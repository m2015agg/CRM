"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, UserPlus, Settings, Database, Shield, GitFork } from "lucide-react"
import { StorageRLSGuide } from "@/components/storage-rls-guide"
import { GitHubSetupGuide } from "@/components/github-setup-guide"
import { GitWorkflowGuide } from "@/components/git-workflow-guide"

export default function AdminConsolePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  useEffect(() => {
    // Check if user is admin, if not redirect
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      if (user.role !== "admin") {
        console.log("User is not admin, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchUsers = async () => {
      if (isLoading || !user || user.role !== "admin") return

      try {
        setIsLoadingUsers(true)
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setUsers(data || [])
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [user, isLoading])

  if (isLoading || isLoadingUsers) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/admin" />
          <h1 className="text-2xl font-bold tracking-tight">Administrator Console</h1>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <GitFork className="h-4 w-4" />
            Setup Guides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || ""} alt={user.full_name} />
                              <AvatarFallback>
                                {user.full_name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "outline"}>
                            {user.role === "admin" ? "Administrator" : "Submitter"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Shield className="h-4 w-4 mr-1" />
                            Edit Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure application settings and storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Storage Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure storage settings for file uploads and attachments.
                    </p>
                    <Button asChild>
                      <a href="/admin/setup">Configure Storage</a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Application Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure general application settings and preferences.
                    </p>
                    <Button>Manage Settings</Button>
                  </CardContent>
                </Card>
              </div>

              <StorageRLSGuide />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4 mt-4">
          <GitHubSetupGuide />
          <GitWorkflowGuide />
        </TabsContent>
      </Tabs>
    </div>
  )
}


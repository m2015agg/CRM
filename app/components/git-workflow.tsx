"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitFork } from "lucide-react"

export default function GitWorkflowGuide() {
  const [activeTab, setActiveTab] = useState("setup")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitFork className="h-5 w-5" />
          Git Fork Workflow
        </CardTitle>
        <CardDescription>A visual guide to organizing your code with Git forks</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="develop">Develop</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="merge">Merge</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">1. Initial Setup</h3>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git clone https://github.com/original/admin-submitter-app.git</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>cd admin-submitter-app</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git remote add upstream https://github.com/original/admin-submitter-app.git</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git remote -v</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This sets up your local repository with a reference to the original repository as "upstream"
            </p>
          </TabsContent>

          <TabsContent value="develop" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">2. Create Feature Branches</h3>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git checkout -b v38-ios-auth</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git add .</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git commit -m "Implement iOS authentication"</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git push origin v38-ios-auth</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Create descriptive branch names for each feature or version you're working on
            </p>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">3. Keep Your Fork Updated</h3>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git checkout main</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git fetch upstream</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git merge upstream/main</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git push origin main</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Regularly sync your fork with the upstream repository to stay up-to-date
            </p>
          </TabsContent>

          <TabsContent value="merge" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">4. Merge Changes Between Versions</h3>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git checkout v38-ios-auth</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git merge --no-ff v25-stable</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-green-600">$</span>
                  <span>git push origin v38-ios-auth</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Selectively merge changes between different versions of your app
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex flex-col space-y-2">
          <h3 className="text-lg font-medium">Version Management Strategy</h3>
          <div className="flex flex-wrap gap-4 mt-2">
            <Card className="flex-1 min-w-[250px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Main Branch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Stable production code</p>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[250px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Version Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">v25, v36, v38, etc.</p>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[250px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Feature Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">ios-auth, fix-loading, etc.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


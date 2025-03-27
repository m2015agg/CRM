"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Check, Copy, ExternalLink } from "lucide-react"

export default function GitHubSetupGuide() {
  const [activeTab, setActiveTab] = useState("create")
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Setting Up Version 39 on GitHub
        </CardTitle>
        <CardDescription>Step-by-step guide to create version 39 and push it to GitHub</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create v39</TabsTrigger>
            <TabsTrigger value="github">GitHub Setup</TabsTrigger>
            <TabsTrigger value="push">Push Code</TabsTrigger>
            <TabsTrigger value="default">Set as Default</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">1. Create Version 39 Branch</h3>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-600">$</span>
                    <span>git checkout v38</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("git checkout v38", "cmd1")}
                    className="h-7 w-7 p-0"
                  >
                    {copied === "cmd1" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-600">$</span>
                    <span>git checkout -b v39</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("git checkout -b v39", "cmd2")}
                    className="h-7 w-7 p-0"
                  >
                    {copied === "cmd2" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-600">$</span>
                    <span>git status</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("git status", "cmd3")}
                    className="h-7 w-7 p-0"
                  >
                    {copied === "cmd3" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This creates a new branch called "v39" based on your current v38 code
            </p>
          </TabsContent>

          <TabsContent value="github" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">2. Create GitHub Repository</h3>
            <div className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li className="text-sm">
                  Go to{" "}
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    github.com/new <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                </li>
                <li className="text-sm">Enter "admin-submitter-app" as the repository name</li>
                <li className="text-sm">Add a description (optional)</li>
                <li className="text-sm">Choose public or private visibility</li>
                <li className="text-sm">Do NOT initialize with README, .gitignore, or license</li>
                <li className="text-sm">Click "Create repository"</li>
              </ol>

              <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertDescription>
                  <p className="text-sm">
                    <strong>Important:</strong> Don't initialize with README, .gitignore, or license if you're pushing
                    an existing repository
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="push" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">3. Push Your Code to GitHub</h3>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-600">$</span>
                    <span>git remote add origin https://github.com/YOUR-USERNAME/admin-submitter-app.git</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        "git remote add origin https://github.com/YOUR-USERNAME/admin-submitter-app.git",
                        "cmd4",
                      )
                    }
                    className="h-7 w-7 p-0"
                  >
                    {copied === "cmd4" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-600">$</span>
                    <span>git push -u origin v39</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("git push -u origin v39", "cmd5")}
                    className="h-7 w-7 p-0"
                  >
                    {copied === "cmd5" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-600">$</span>
                    <span>git push -u origin v38</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("git push -u origin v38", "cmd6")}
                    className="h-7 w-7 p-0"
                  >
                    {copied === "cmd6" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-600">$</span>
                    <span>git push -u origin v25</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("git push -u origin v25", "cmd7")}
                    className="h-7 w-7 p-0"
                  >
                    {copied === "cmd7" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Replace "YOUR-USERNAME" with your actual GitHub username. This pushes your v39 branch to GitHub and sets
              it as the tracking branch.
            </p>
          </TabsContent>

          <TabsContent value="default" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">4. Set v39 as Default Branch</h3>
            <div className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li className="text-sm">Go to your repository on GitHub</li>
                <li className="text-sm">Click on "Settings" (tab near the top)</li>
                <li className="text-sm">In the left sidebar, click "Branches"</li>
                <li className="text-sm">Under "Default branch", click the switch button</li>
                <li className="text-sm">Select "v39" from the dropdown</li>
                <li className="text-sm">Click "Update"</li>
                <li className="text-sm">Confirm the change when prompted</li>
              </ol>

              <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900 mt-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-green-600">$</span>
                      <span>git checkout v39</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("git checkout v39", "cmd8")}
                      className="h-7 w-7 p-0"
                    >
                      {copied === "cmd8" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-green-600">$</span>
                      <span>git branch -a</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("git branch -a", "cmd9")}
                      className="h-7 w-7 p-0"
                    >
                      {copied === "cmd9" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <h3 className="text-lg font-medium mb-3">Additional Tips</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Create a README.md file to document your project</li>
            <li>Add a .gitignore file for Node.js projects</li>
            <li>Consider creating a develop branch for ongoing development</li>
            <li>Use GitHub Issues to track bugs and feature requests</li>
            <li>Set up GitHub Actions for CI/CD if needed</li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  )
}


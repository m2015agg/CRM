"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function GitHubSetupGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Setup Guide</CardTitle>
        <CardDescription>Learn how to set up GitHub for your project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">1. Create a GitHub Repository</h3>
          <p className="text-sm text-muted-foreground">
            Go to GitHub.com and create a new repository for your project. Make sure to initialize it with a README file.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">2. Clone the Repository</h3>
          <p className="text-sm text-muted-foreground">
            Clone your repository locally using the following command:
          </p>
          <pre className="bg-muted p-2 rounded-md text-sm">
            git clone https://github.com/yourusername/yourrepository.git
          </pre>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">3. Set Up Git Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure your Git username and email:
          </p>
          <pre className="bg-muted p-2 rounded-md text-sm">
            git config --global user.name "Your Name"
            git config --global user.email "your.email@example.com"
          </pre>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">4. Create a Branch</h3>
          <p className="text-sm text-muted-foreground">
            Create and switch to a new branch for your changes:
          </p>
          <pre className="bg-muted p-2 rounded-md text-sm">
            git checkout -b feature/your-feature-name
          </pre>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">5. Commit and Push Changes</h3>
          <p className="text-sm text-muted-foreground">
            After making changes, commit and push them to GitHub:
          </p>
          <pre className="bg-muted p-2 rounded-md text-sm">
            git add .
            git commit -m "Your commit message"
            git push origin feature/your-feature-name
          </pre>
        </div>
      </CardContent>
    </Card>
  )
} 
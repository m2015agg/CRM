"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function GitWorkflowGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Git Workflow Guide</CardTitle>
        <CardDescription>Learn about our Git workflow and best practices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Branch Naming Convention</h3>
          <p className="text-sm text-muted-foreground">
            Follow these branch naming conventions:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>feature/feature-name - for new features</li>
            <li>bugfix/bug-description - for bug fixes</li>
            <li>hotfix/issue-description - for urgent fixes</li>
            <li>release/version-number - for release branches</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Commit Messages</h3>
          <p className="text-sm text-muted-foreground">
            Write clear and descriptive commit messages:
          </p>
          <pre className="bg-muted p-2 rounded-md text-sm">
            feat: add user authentication
            fix: resolve login redirect issue
            docs: update README with setup instructions
            style: format code according to guidelines
          </pre>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Pull Request Process</h3>
          <p className="text-sm text-muted-foreground">
            Follow these steps when creating a pull request:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground">
            <li>Create a new branch from main</li>
            <li>Make your changes and commit them</li>
            <li>Push your branch to GitHub</li>
            <li>Create a pull request</li>
            <li>Get code review and address feedback</li>
            <li>Merge after approval</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Code Review Guidelines</h3>
          <p className="text-sm text-muted-foreground">
            When reviewing code, check for:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Code quality and readability</li>
            <li>Test coverage</li>
            <li>Performance implications</li>
            <li>Security considerations</li>
            <li>Documentation updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 
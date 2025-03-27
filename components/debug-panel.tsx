"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

interface DebugPanelProps {
  title?: string
  data: any
}

export function DebugPanel({ title = "Debug Information", data }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="mt-4 border-dashed border-yellow-500 bg-yellow-50">
      <CardHeader className="py-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between p-0">
              <CardTitle className="text-sm font-medium text-yellow-800">{title}</CardTitle>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 pb-0">
              <pre className="whitespace-pre-wrap overflow-auto text-xs text-yellow-900 max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  )
}


"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserSelectorProps {
  value: string | null
  onChange: (value: string) => void
  isLoading?: boolean
}

export function UserSelector({ value, onChange, isLoading }: UserSelectorProps) {
  return (
    <div className="w-64">
      <Select value={value || "all"} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Filter by user" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          {/* We'll fetch users dynamically in the parent component */}
        </SelectContent>
      </Select>
    </div>
  )
}


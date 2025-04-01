import { WorkingKanbanBoard } from "@/components/working-kanban-board"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

export default function WorkingKanbanPage() {
  return (
    <div className="space-y-4 p-4 bg-background text-foreground min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Opportunities</h1>
        <DarkModeToggle />
      </div>
      <WorkingKanbanBoard />
    </div>
  )
}


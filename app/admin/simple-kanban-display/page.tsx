import { SimpleKanbanDisplay } from "@/components/simple-kanban-display"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

export default function SimpleKanbanDisplayPage() {
  return (
    <div className="space-y-4 p-4 bg-background text-foreground min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Simple Kanban Display</h1>
        <DarkModeToggle />
      </div>
      <SimpleKanbanDisplay />
    </div>
  )
}


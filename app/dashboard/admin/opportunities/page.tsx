import { FullKanbanBoard } from "@/components/full-kanban-board"

export default function TeamOpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Team Opportunities</h1>
      </div>
      <FullKanbanBoard />
    </div>
  )
}


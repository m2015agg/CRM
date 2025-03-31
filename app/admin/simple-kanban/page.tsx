import { SimpleKanbanView } from "@/components/simple-kanban-view"
import { AuthDebug } from "@/components/auth-debug"

export default function SimpleKanbanPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Simple Kanban View</h1>
      </div>
      <AuthDebug />
      <SimpleKanbanView />
    </div>
  )
}


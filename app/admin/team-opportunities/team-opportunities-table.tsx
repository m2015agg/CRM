"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { deleteOpportunity } from "./actions"
import { useToast } from "@/hooks/use-toast"
import OpportunityDialog from "@/components/opportunities/opportunity-dialog"

type Opportunity = {
  id: string
  title: string
  status: string
  value: number | null
  client_name: string | null
  expected_close_date: string | null
  created_at: string
  users: {
    full_name: string | null
    email: string
  }
}

type TeamMember = {
  id: string
  full_name: string | null
  email: string
  role: string
}

export default function TeamOpportunitiesTable({
  opportunities,
  teamMembers,
  userRole,
}: {
  opportunities: Opportunity[]
  teamMembers: TeamMember[]
  userRole: string | null
}) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const isAdmin = userRole === "admin"

  const handleDelete = async (id: string) => {
    const result = await deleteOpportunity(id)

    if (result.success) {
      toast({
        title: "Opportunity deleted",
        description: "The opportunity has been successfully deleted.",
      })
      setDeleteDialogOpen(false)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete opportunity.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            New
          </Badge>
        )
      case "qualified":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Qualified
          </Badge>
        )
      case "proposal":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Proposal
          </Badge>
        )
      case "negotiation":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Negotiation
          </Badge>
        )
      case "closed won":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Closed Won
          </Badge>
        )
      case "closed lost":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Closed Lost
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Expected Close</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No opportunities found
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium">{opp.title}</TableCell>
                <TableCell>{opp.client_name || "-"}</TableCell>
                <TableCell>{opp.users?.full_name || opp.users?.email}</TableCell>
                <TableCell>{getStatusBadge(opp.status)}</TableCell>
                <TableCell className="text-right">{opp.value ? formatCurrency(opp.value) : "-"}</TableCell>
                <TableCell>{opp.expected_close_date ? formatDate(opp.expected_close_date) : "-"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOpp(opp)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOpp(opp)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Opportunity</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete &quot;{selectedOpp?.title}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => selectedOpp && handleDelete(selectedOpp.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Opportunity Dialog */}
      {selectedOpp && (
        <OpportunityDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          opportunity={selectedOpp}
          teamMembers={isAdmin ? teamMembers : []}
          isAdmin={isAdmin}
        />
      )}
    </>
  )
}


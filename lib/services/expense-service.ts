import { type ExpenseInsert, type ExpenseUpdate, ExpenseType } from "@/lib/types"

// Update the create and update methods:
\
async create(data:
{
  expense_date: Date | string
  expense_type: ExpenseType
  amount: number
  description?: string | null
  client_name?: string | null
  location?: string | null
  discussion_notes?: string | null
  receipt_url?: string | null
  associated_call?: string | null
}
): Promise<Expense>
{
  try {
    const userId = await this.getCurrentUserId()

    // Log the data being sent to the database
    console.log("Creating expense with data:", {
      ...data,
      submitter_id: userId,
    })

    const expenseData: ExpenseInsert = {
      submitter_id: userId,
      expense_date: this.formatDate(data.expense_date),
      expense_type: data.expense_type,
      amount: data.amount,
      description: data.description || null,
      client_name: data.client_name || null,
      location: data.location || null,
      discussion_notes: data.discussion_notes || null,
      receipt_url: data.receipt_url || null,
      associated_call: data.associated_call || null,
    }

    const { data: result, error } = await this.supabase.from("expenses").insert(expenseData).select().single()

    if (error) {
      console.error("Database error creating expense:", error)
      this.handleError(error, "create expense")
    }

    console.log("Expense created successfully:", result)
    return result
  } catch (error) {
    this.handleError(error, "create expense")
  }
}

async
update(
  id: string,
  data: {
    expense_date?: Date | string
    expense_type?: ExpenseType
    amount?: number
    description?: string | null
    client_name?: string | null
    location?: string | null
    discussion_notes?: string | null
    receipt_url?: string | null
    associated_call?: string | null
},
): Promise<Expense>
{
  try {
    // Log the data being sent to the database
    console.log(`Updating expense ${id} with data:`, data)

    const updateData: ExpenseUpdate = {
      ...data,
      updated_at: new Date().toISOString(),
    }

    if (data.expense_date) {
      updateData.expense_date = this.formatDate(data.expense_date)
    }

    const { data: result, error } = await this.supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Database error updating expense:", error)
      this.handleError(error, "update expense")
    }

    console.log("Expense updated successfully:", result)
    return result
  } catch (error) {
    this.handleError(error, "update expense")
  }
}


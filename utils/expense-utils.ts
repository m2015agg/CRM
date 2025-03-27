import type { Database } from "@/lib/database.types"

type Expense = Database["public"]["Tables"]["expenses"]["Row"]
type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]

/**
 * Groups expenses by their associated call
 * @param expenses Array of expenses
 * @returns Object with call names as keys and arrays of expenses as values
 */
export function groupExpensesByCalls(expenses: Expense[]): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {}

  // First add a group for expenses with no associated call
  grouped["Unassociated"] = []

  expenses.forEach((expense) => {
    const callName = expense.associated_call || "Unassociated"

    if (!grouped[callName]) {
      grouped[callName] = []
    }

    grouped[callName].push(expense)
  })

  return grouped
}

/**
 * Calculates total expenses by call
 * @param expenses Array of expenses
 * @returns Object with call names as keys and total amounts as values
 */
export function calculateExpensesByCall(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {}
  const grouped = groupExpensesByCalls(expenses)

  Object.entries(grouped).forEach(([callName, callExpenses]) => {
    totals[callName] = callExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  })

  return totals
}

/**
 * Finds the most expensive call based on associated expenses
 * @param expenses Array of expenses
 * @param calls Array of call notes
 * @returns The call with the highest total expenses, or null if no calls with expenses
 */
export function findMostExpensiveCall(
  expenses: Expense[],
  calls: CallNote[],
): { call: CallNote; total: number } | null {
  const expensesByCall = calculateExpensesByCall(expenses)

  // Remove the "Unassociated" category
  delete expensesByCall["Unassociated"]

  if (Object.keys(expensesByCall).length === 0) {
    return null
  }

  // Find the call name with the highest total
  const mostExpensiveCallName = Object.entries(expensesByCall).sort((a, b) => b[1] - a[1])[0][0]

  // Find the corresponding call object
  const call = calls.find((c) => c.client_name === mostExpensiveCallName)

  if (!call) {
    return null
  }

  return {
    call,
    total: expensesByCall[mostExpensiveCallName],
  }
}


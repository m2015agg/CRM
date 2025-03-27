"use client"

import { useState, useCallback } from "react"
import { dailyReportService, callNoteService, expenseService, userService } from "@/lib/services"
import { supabase } from "@/lib/supabase/client"

export function useStorage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Generic wrapper for service methods
  const executeOperation = useCallback(async (operation, errorMessage) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await operation()
      return result
    } catch (err) {
      console.error(`${errorMessage}:`, err)
      const errorMsg = err instanceof Error ? err.message : errorMessage
      setError(errorMsg)

      // Return null instead of throwing to prevent React rendering errors
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Daily Report operations
  const createDailyReport = useCallback(
    (data) => {
      return executeOperation(() => dailyReportService.create(data), "Failed to create daily report")
    },
    [executeOperation],
  )

  const getDailyReportByDate = useCallback(
    (date, userId) => {
      return executeOperation(() => dailyReportService.getByDate(date, userId), "Failed to get daily report")
    },
    [executeOperation],
  )

  const getAllDailyReports = useCallback(
    (options) => {
      return executeOperation(() => dailyReportService.getAll(options), "Failed to get daily reports")
    },
    [executeOperation],
  )

  const updateDailyReport = useCallback(
    (id, data) => {
      return executeOperation(() => dailyReportService.update(id, data), "Failed to update daily report")
    },
    [executeOperation],
  )

  const deleteDailyReport = useCallback(
    (id) => {
      return executeOperation(() => dailyReportService.delete(id), "Failed to delete daily report")
    },
    [executeOperation],
  )

  const cleanupDuplicateDailyReports = useCallback(
    (date, userId) => {
      return executeOperation(
        () => dailyReportService.cleanupDuplicates(date, userId),
        "Failed to cleanup duplicate reports",
      )
    },
    [executeOperation],
  )

  // Call Note operations
  const createCallNote = useCallback(
    (data) => {
      return executeOperation(() => callNoteService.create(data), "Failed to create call note")
    },
    [executeOperation],
  )

  const getCallNoteById = useCallback(
    (id) => {
      return executeOperation(() => callNoteService.getById(id), "Failed to get call note")
    },
    [executeOperation],
  )

  const getAllCallNotes = useCallback(
    (options) => {
      return executeOperation(() => callNoteService.getAll(options), "Failed to get call notes")
    },
    [executeOperation],
  )

  const updateCallNote = useCallback(
    (id, data) => {
      return executeOperation(() => callNoteService.update(id, data), "Failed to update call note")
    },
    [executeOperation],
  )

  const deleteCallNote = useCallback(
    (id) => {
      return executeOperation(() => callNoteService.delete(id), "Failed to delete call note")
    },
    [executeOperation],
  )

  const addCallNoteAttachment = useCallback(
    (id, attachmentUrl) => {
      return executeOperation(() => callNoteService.addAttachment(id, attachmentUrl), "Failed to add attachment")
    },
    [executeOperation],
  )

  const removeCallNoteAttachment = useCallback(
    (id, attachmentUrl) => {
      return executeOperation(() => callNoteService.removeAttachment(id, attachmentUrl), "Failed to remove attachment")
    },
    [executeOperation],
  )

  // Expense operations
  const createExpense = useCallback(
    (data) => {
      console.log("Creating expense with data:", data)
      return executeOperation(() => expenseService.create(data), "Failed to create expense")
    },
    [executeOperation],
  )

  const getExpenseById = useCallback(
    (id) => {
      return executeOperation(() => expenseService.getById(id), "Failed to get expense")
    },
    [executeOperation],
  )

  interface DateRangeParams {
    startDate: string
    endDate: string
  }

  const getAllExpenses = useCallback(
    async ({ startDate, endDate }: DateRangeParams) => {
      setIsLoading(true)
      setError(null)
      try {
        console.log(`Fetching expenses from ${startDate} to ${endDate}`)

        // Use the singleton instance directly
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .gte("expense_date", startDate)
          .lte("expense_date", endDate)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching expenses:", error)
          setError(error.message)
          return []
        }

        console.log(`Found ${data.length} expenses`)

        // Log receipt URLs for debugging
        data.forEach((expense) => {
          if (expense.receipt_url) {
            console.log(`Expense ${expense.id} has receipt URL: ${expense.receipt_url}`)
          }
        })

        return data
      } catch (err) {
        console.error("Error in getAllExpenses:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [setError, setIsLoading],
  )

  const updateExpense = useCallback(
    (id, data) => {
      console.log(`Updating expense ${id} with data:`, data)
      return executeOperation(() => expenseService.update(id, data), "Failed to update expense")
    },
    [executeOperation],
  )

  const deleteExpense = useCallback(
    (id) => {
      return executeOperation(() => expenseService.delete(id), "Failed to delete expense")
    },
    [executeOperation],
  )

  const getTotalExpenses = useCallback(
    (options) => {
      return executeOperation(() => expenseService.getTotal(options), "Failed to get total expenses")
    },
    [executeOperation],
  )

  // User operations
  const getCurrentUser = useCallback(() => {
    return executeOperation(() => userService.getCurrentUser(), "Failed to get current user")
  }, [executeOperation])

  const getUserById = useCallback(
    (id) => {
      return executeOperation(() => userService.getById(id), "Failed to get user")
    },
    [executeOperation],
  )

  const getAllUsers = useCallback(
    (options) => {
      return executeOperation(() => userService.getAll(options), "Failed to get users")
    },
    [executeOperation],
  )

  const updateUserProfile = useCallback(
    (data) => {
      return executeOperation(() => userService.updateProfile(data), "Failed to update profile")
    },
    [executeOperation],
  )

  const updateUserAvatar = useCallback(
    (avatarUrl) => {
      return executeOperation(() => userService.updateAvatar(avatarUrl), "Failed to update avatar")
    },
    [executeOperation],
  )

  const updateUserRole = useCallback(
    (userId, role) => {
      return executeOperation(() => userService.updateRole(userId, role), "Failed to update user role")
    },
    [executeOperation],
  )

  return {
    isLoading,
    error,
    // Daily Report operations
    createDailyReport,
    getDailyReportByDate,
    getAllDailyReports,
    updateDailyReport,
    deleteDailyReport,
    cleanupDuplicateDailyReports,
    // Call Note operations
    createCallNote,
    getCallNoteById,
    getAllCallNotes,
    updateCallNote,
    deleteCallNote,
    addCallNoteAttachment,
    removeCallNoteAttachment,
    // Expense operations
    createExpense,
    getExpenseById,
    getAllExpenses,
    updateExpense,
    deleteExpense,
    getTotalExpenses,
    // User operations
    getCurrentUser,
    getUserById,
    getAllUsers,
    updateUserProfile,
    updateUserAvatar,
    updateUserRole,
  }
}


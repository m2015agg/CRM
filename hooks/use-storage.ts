"use client"

import { useState, useCallback } from "react"
import { dailyReportService, callNoteService, expenseService, userService } from "@/lib/services"
import { supabase } from "@/lib/supabase/client"

export function useStorage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generic wrapper for service methods
  const executeOperation = useCallback(async (operation: () => Promise<any>, errorMessage: string, args?: any) => {
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
    (data: any) => {
      return executeOperation(() => dailyReportService.create(data), "Failed to create daily report", data)
    },
    [executeOperation],
  )

  const getDailyReportByDate = useCallback(
    (date: string, userId: string) => {
      return executeOperation(() => dailyReportService.getByDate(date, userId), "Failed to get daily report", { date, userId })
    },
    [executeOperation],
  )

  const getAllDailyReports = useCallback(
    (options: any) => {
      return executeOperation(() => dailyReportService.getAll(options), "Failed to get daily reports", options)
    },
    [executeOperation],
  )

  const updateDailyReport = useCallback(
    (id: string, data: any) => {
      return executeOperation(() => dailyReportService.update(id, data), "Failed to update daily report", { id, data })
    },
    [executeOperation],
  )

  const deleteDailyReport = useCallback(
    (id: string) => {
      return executeOperation(() => dailyReportService.delete(id), "Failed to delete daily report", id)
    },
    [executeOperation],
  )

  const cleanupDuplicateDailyReports = useCallback(
    (date: string, userId: string) => {
      return executeOperation(
        () => dailyReportService.cleanupDuplicates(date, userId),
        "Failed to cleanup duplicate reports",
        { date, userId }
      )
    },
    [executeOperation],
  )

  // Call Note operations
  const createCallNote = useCallback(
    (data: any) => {
      return executeOperation(() => callNoteService.create(data), "Failed to create call note", data)
    },
    [executeOperation],
  )

  const getCallNoteById = useCallback(
    (id: string) => {
      return executeOperation(() => callNoteService.getById(id), "Failed to get call note", id)
    },
    [executeOperation],
  )

  const getAllCallNotes = useCallback(
    (options: { startDate?: string; endDate?: string; userId?: string; daily_reports_uuid?: string }) => {
      console.log("Fetching call notes with parameters:", {
        startDate: options.startDate,
        endDate: options.endDate,
        userId: options.userId,
        daily_reports_uuid: options.daily_reports_uuid,
      })
      return executeOperation(() => callNoteService.getAll(options), "Failed to get call notes", options)
    },
    [executeOperation],
  )

  const updateCallNote = useCallback(
    (id: string, data: any) => {
      return executeOperation(() => callNoteService.update(id, data), "Failed to update call note", { id, data })
    },
    [executeOperation],
  )

  const deleteCallNote = useCallback(
    (id: string) => {
      return executeOperation(() => callNoteService.delete(id), "Failed to delete call note", id)
    },
    [executeOperation],
  )

  const addCallNoteAttachment = useCallback(
    (id: string, attachmentUrl: string) => {
      return executeOperation(() => callNoteService.addAttachment(id, attachmentUrl), "Failed to add attachment", { id, attachmentUrl })
    },
    [executeOperation],
  )

  const removeCallNoteAttachment = useCallback(
    (id: string, attachmentUrl: string) => {
      return executeOperation(() => callNoteService.removeAttachment(id, attachmentUrl), "Failed to remove attachment", { id, attachmentUrl })
    },
    [executeOperation],
  )

  // Expense operations
  const createExpense = useCallback(
    (data: any) => {
      console.log("Creating expense with data:", data)
      return executeOperation(() => expenseService.create(data), "Failed to create expense", data)
    },
    [executeOperation],
  )

  const getExpenseById = useCallback(
    (id: string) => {
      return executeOperation(() => expenseService.getById(id), "Failed to get expense", id)
    },
    [executeOperation],
  )

  interface DateRangeParams {
    startDate: string
    endDate: string
    userId?: string
    daily_reports_uuid?: string
  }

  const getAllExpenses = useCallback(
    (options: { startDate?: string; endDate?: string; userId?: string; daily_reports_uuid?: string }) => {
      return executeOperation(
        ((): Promise<any> => {
          console.log(`Fetching expenses with parameters:`, options)
          return Promise.resolve(
            supabase
              .from("expenses")
              .select("*")
              .eq("daily_reports_uuid", options.daily_reports_uuid)
              .order("created_at", { ascending: false })
              .then(({ data, error }) => {
                if (error) {
                  throw error
                }
                console.log(`Found ${data.length} expenses`)
                return data
              })
          )
        }),
        "Failed to get expenses",
        options
      )
    },
    [executeOperation]
  )

  const updateExpense = useCallback(
    (id: string, data: any) => {
      console.log(`Updating expense ${id} with data:`, data)
      return executeOperation(() => expenseService.update(id, data), "Failed to update expense", { id, data })
    },
    [executeOperation],
  )

  const deleteExpense = useCallback(
    (id: string) => {
      return executeOperation(() => expenseService.delete(id), "Failed to delete expense", id)
    },
    [executeOperation],
  )

  // User operations
  const getCurrentUser = useCallback(() => {
    return executeOperation(() => userService.getCurrentUser(), "Failed to get current user", {})
  }, [executeOperation])

  const getUserById = useCallback(
    (id: string) => {
      return executeOperation(() => userService.getById(id), "Failed to get user", id)
    },
    [executeOperation],
  )

  const getAllUsers = useCallback(
    (options: any) => {
      return executeOperation(() => userService.getAll(options), "Failed to get users", options)
    },
    [executeOperation],
  )

  const updateUserProfile = useCallback(
    (data: any) => {
      return executeOperation(() => userService.updateProfile(data), "Failed to update profile", data)
    },
    [executeOperation],
  )

  const updateUserAvatar = useCallback(
    (avatarUrl: string) => {
      return executeOperation(
        async () => {
          const userId = (await userService.getCurrentUser()).id
          return userService.updateAvatar(userId, avatarUrl)
        },
        "Failed to update avatar",
        { avatarUrl }
      )
    },
    [executeOperation]
  )

  const updateUserRole = useCallback(
    (userId: string, role: string) => {
      return executeOperation(() => userService.updateRole(userId, role), "Failed to update user role", { userId, role })
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
    // User operations
    getCurrentUser,
    getUserById,
    getAllUsers,
    updateUserProfile,
    updateUserAvatar,
    updateUserRole,
  }
}


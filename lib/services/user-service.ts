import { BaseService } from "@/lib/services/base-service"
import type { Database } from "@/lib/database.types"
import { deleteFile } from "@/lib/storage-utils"

type User = Database["public"]["Tables"]["users"]["Row"]
type UserUpdate = Database["public"]["Tables"]["users"]["Update"]

export class UserService extends BaseService {
  /**
   * Get the current user's profile
   * @returns The user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await this.supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        this.handleError(error, "get current user")
      }

      return data
    } catch (error) {
      this.handleError(error, "get current user")
    }
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns The user or null if not found
   */
  async getById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        this.handleError(error, "get user")
      }

      return data
    } catch (error) {
      this.handleError(error, "get user")
    }
  }

  /**
   * Get all users (admin only)
   * @param options Query options
   * @returns Array of users
   */
  async getAll(
    options: {
      role?: "admin" | "submitter"
      limit?: number
      offset?: number
    } = {},
  ): Promise<User[]> {
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentUser()

      if (currentUser.role !== "admin") {
        throw new Error("Unauthorized: Only admins can list all users")
      }

      let query = this.supabase.from("users").select("*").order("full_name", { ascending: true })

      if (options.role) {
        query = query.eq("role", options.role)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        this.handleError(error, "get users")
      }

      return data || []
    } catch (error) {
      this.handleError(error, "get users")
    }
  }

  /**
   * Update a user's profile
   * @param data Update data
   * @returns The updated user
   */
  async updateProfile(data: {
    full_name?: string
    avatar_url?: string | null
  }): Promise<User> {
    try {
      const userId = await this.getCurrentUserId()

      const updateData: UserUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      const { data: result, error } = await this.supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        this.handleError(error, "update profile")
      }

      return result
    } catch (error) {
      this.handleError(error, "update profile")
    }
  }

  /**
   * Update a user's avatar
   * @param avatarUrl New avatar URL
   * @returns The updated user
   */
  async updateAvatar(avatarUrl: string): Promise<User> {
    try {
      const userId = await this.getCurrentUserId()

      // Get current user to check if they have an existing avatar
      const currentUser = await this.getById(userId)

      if (currentUser?.avatar_url) {
        // Delete the old avatar
        try {
          await deleteFile(currentUser.avatar_url)
        } catch (err) {
          console.error(`Failed to delete old avatar: ${currentUser.avatar_url}`, err)
          // Continue with update even if deletion fails
        }
      }

      // Update with new avatar
      return await this.updateProfile({ avatar_url: avatarUrl })
    } catch (error) {
      this.handleError(error, "update avatar")
    }
  }

  /**
   * Update a user's role (admin only)
   * @param userId User ID to update
   * @param role New role
   * @returns The updated user
   */
  async updateRole(userId: string, role: "admin" | "submitter"): Promise<User> {
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentUser()

      if (currentUser.role !== "admin") {
        throw new Error("Unauthorized: Only admins can update user roles")
      }

      const updateData: UserUpdate = {
        role,
        updated_at: new Date().toISOString(),
      }

      const { data: result, error } = await this.supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        this.handleError(error, "update user role")
      }

      return result
    } catch (error) {
      this.handleError(error, "update user role")
    }
  }
}

// Export a singleton instance
export const userService = new UserService()


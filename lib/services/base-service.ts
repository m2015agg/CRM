import { getSupabaseClient } from "@/lib/supabase/client"

export class BaseService {
  protected supabase = getSupabaseClient()

  constructor() {}
}


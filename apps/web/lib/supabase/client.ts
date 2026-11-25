import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://giwwacyiaqeqzelqamne.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_tqAiHDoulfMmlu_bvuuk8w_uJNP9z2g";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

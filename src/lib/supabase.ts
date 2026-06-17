// This file must NOT contain import() to avoid Vite entry-point bug
// Dynamic import happens at call site in dropsService

let client: any = null;

export async function getSupabase(): Promise<any | null> {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { available: true }; // placeholder - actual client created in dropsService
}

export function isSupabaseAvailable(): boolean {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
}

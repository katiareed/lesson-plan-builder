import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const notConfiguredError = new Error(
  "Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
);

const stubFunctions = {
  invoke: () => Promise.resolve({ data: null, error: notConfiguredError }),
};

function makeClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { functions: stubFunctions } as unknown as SupabaseClient;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = makeClient();

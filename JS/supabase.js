// ========================================
// STUDYSYNC — SUPABASE CLIENT
// ========================================

const SUPABASE_URL = "https://ffekkfigehdwfdrviizh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable__TMXRXnCvxOO7VVJsfyOfQ_3Nmzy1ZT";

const studySyncSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);

console.log("Supabase connected!");
console.log("Auth available:", studySyncSupabase.auth);

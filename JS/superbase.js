const SUPABASE_URL = "https://ffekkfigehdwfdrviizh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__TMXRXnCvxOO7VVJsfyOfQ_3Nmzy1ZT";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

console.log("Supabase connected!");
// something about the url error in the concole so check .

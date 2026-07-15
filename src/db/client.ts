import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Schema defaults to 'public' so a project cloned standalone (per the README)
// needs no configuration. Setting SUPABASE_SCHEMA lets multiple tools share
// one Supabase project without table-name collisions, each in its own schema
// (the schema itself must also be added to Supabase's "Exposed schemas" list
// in Project Settings > API for PostgREST to serve it).
//
// Cast to the bare SupabaseClient type: this codebase never imports Supabase's
// generated Database types (every query is an untyped `.from('table')` call),
// so the schema-name type parameter carries no real type safety here — only
// the runtime `db.schema` config, which createClient sets correctly above.
export function createDb(url: string, serviceKey: string, schema = 'public'): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    db: { schema },
  }) as unknown as SupabaseClient;
}

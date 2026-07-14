import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

interface MockResponse {
  data: unknown;
  error: unknown;
}

/**
 * Builds a mock SupabaseClient where `.from(table)` returns a chainable
 * object whose terminal method (maybeSingle/single/etc.) resolves to the
 * given result. Configure per-table behavior via the `responses` map.
 *
 * Supports both single-row queries (terminated by maybeSingle/single) and
 * list queries (resolved via thenable pattern).
 *
 * @param responses - Map of table names to { data, error } responses
 * @returns Mock SupabaseClient
 *
 * @example
 * // Single-row query
 * const db = createMockDb({ users: { data: { id: 'u1' }, error: null } });
 * const result = await db.from('users').select('id').eq('telegram_id', 123).maybeSingle();
 *
 * @example
 * // List query
 * const db = createMockDb({ gifts: { data: [{ id: 'g1' }], error: null } });
 * const result = await db.from('gifts').select('*').eq('banked', false);
 */
export function createMockDb(responses: Record<string, MockResponse>): SupabaseClient {
  const from = vi.fn((table: string) => {
    const response = responses[table] ?? { data: null, error: null };

    // Create a chainable object with all query methods.
    const chain: Record<string, any> = {};

    // Methods that return the chain for further chaining.
    const chainMethods = ['select', 'eq', 'insert', 'update', 'upsert', 'delete', 'order', 'in', 'not'];
    for (const method of chainMethods) {
      chain[method] = vi.fn(() => chain);
    }

    // Terminal methods that resolve with the response.
    chain.maybeSingle = vi.fn(async () => response);
    chain.single = vi.fn(async () => response);

    // Support thenable pattern for list queries.
    // This allows: await db.from('gifts').select(...).eq(...)
    chain.then = vi.fn((resolve: (value: MockResponse) => void, reject?: (reason?: any) => void) => {
      try {
        resolve(response);
      } catch (err) {
        reject?.(err);
      }
      return Promise.resolve(response);
    });

    return chain;
  });

  return { from } as unknown as SupabaseClient;
}

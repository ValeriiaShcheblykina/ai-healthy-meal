/// <reference types="astro/client" />

import type { SupabaseClient } from '@/db/supabase.client.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user?: {
        id: string;
        email: string;
      };
      runtime?: {
        env?: Record<string, string>;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPEN_ROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

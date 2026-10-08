import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Local storage keys for dynamic Supabase settings
export const SUPABASE_CONFIG_STORAGE_KEY = 'edadmin_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return {
      url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
      anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
      enabled: Boolean((import.meta as any).env?.VITE_SUPABASE_URL)
    };
  }

  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url,
          anonKey: parsed.anonKey,
          enabled: parsed.enabled !== false
        };
      }
    }
  } catch {}

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    enabled: Boolean(envUrl && envKey)
  };
}

export function saveStoredSupabaseConfig(config: { url: string; anonKey: string; enabled?: boolean }) {
  if (typeof window === 'undefined') return;
  const cleanedConfig: SupabaseConfig = {
    url: config.url.trim().replace(/\/+$/, ''),
    anonKey: config.anonKey.trim(),
    enabled: config.enabled !== false
  };
  localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(cleanedConfig));
  cachedClient = null; // Reset cache so new client is instantiated
  window.dispatchEvent(new CustomEvent('supabase-config-changed', { detail: cleanedConfig }));
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey || !config.enabled) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export function isSupabaseActive(): boolean {
  const client = getSupabaseClient();
  return Boolean(client);
}

/**
 * Test connectivity with configured Supabase instance
 */
export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const config = getStoredSupabaseConfig();
  const url = overrideUrl || config.url;
  const key = overrideKey || config.anonKey;

  if (!url || !key) {
    return {
      success: false,
      message: 'URL Supabase dan Anon/Public Key belum diisi.'
    };
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false }
    });

    // Test querying app_users table or checking service response
    const { data, error } = await client
      .from('app_users')
      .select('id, username')
      .limit(1);

    if (error) {
      // If table does not exist, provide clear guidance
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Terhubung ke Supabase, namun tabel `app_users` belum dibuat. Silakan jalankan script `supabase-schema.sql` di SQL Editor Supabase Anda.'
        };
      }
      return {
        success: false,
        message: `Koneksi ditolak Supabase: ${error.message} (Kode: ${error.code})`
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase berhasil! Database siap digunakan untuk semua akun.',
      details: data
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi Supabase: ${err.message || 'Periksa URL dan koneksi internet.'}`
    };
  }
}

/**
 * Fetch table documents from Supabase with user_uid scoping
 */
export async function supabaseFetchCollection<T>(tableName: string, userUid: string): Promise<T[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('user_uid', userUid);

    if (error) {
      console.warn(`Supabase query ${tableName} error:`, error.message);
      return [];
    }

    return (data || []).map((row: any) => {
      if (row.data && typeof row.data === 'object') {
        return { id: row.id, ...row.data, ...row } as T;
      }
      return row as T;
    });
  } catch (err) {
    console.error(`Error fetching from Supabase table ${tableName}:`, err);
    return [];
  }
}

/**
 * Save / Upsert single item in Supabase table
 */
export async function supabaseUpsertDocument(
  tableName: string,
  id: string,
  data: Record<string, any>,
  userUid: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: any = {
      id,
      user_uid: userUid,
      data,
      updated_at: new Date().toISOString()
    };

    // Populate common relational columns if present
    if (data.nama) payload.nama = data.nama;
    if (data.nis) payload.nis = data.nis;
    if (data.nisn) payload.nisn = data.nisn;
    if (data.kelas) payload.kelas = data.kelas;
    if (data.tanggal) payload.tanggal = data.tanggal;
    if (data.status) payload.status = data.status;

    const { error } = await client
      .from(tableName)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn(`Supabase upsert ${tableName} error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error upserting Supabase table ${tableName}:`, err);
    return false;
  }
}

/**
 * Delete item from Supabase table
 */
export async function supabaseDeleteDocument(tableName: string, id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Supabase delete ${tableName} error:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error deleting from Supabase table ${tableName}:`, err);
    return false;
  }
}

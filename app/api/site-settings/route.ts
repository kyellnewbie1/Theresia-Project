import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ settings: {} }, { headers: { 'Cache-Control': 'no-store' } });
  const supabase = createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from('site_settings').select('key,value').in('key', ['site_notice','character_video_url']);
  if (error) return NextResponse.json({ settings: {} }, { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ settings: Object.fromEntries((data ?? []).map((x) => [x.key, x.value])) }, { headers: { 'Cache-Control': 'no-store' } });
}

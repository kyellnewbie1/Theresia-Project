import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase-server';
export const dynamic = 'force-dynamic';
async function context() {
  const session = await createServerSupabase();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Login diperlukan.' }, { status: 401 }) };
  const { data } = await session.from('profiles').select('is_owner').eq('id', user.id).maybeSingle();
  if (!data?.is_owner) return { error: NextResponse.json({ error: 'Akses owner saja.' }, { status: 403 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: NextResponse.json({ error: 'Service key belum disetel.' }, { status: 503 }) };
  return { admin: createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }), actorId: user.id };
}
export async function GET() {
  const c = await context(); if ('error' in c) return c.error;
  const { data, error } = await c.admin.from('site_settings').select('key,value').in('key', ['site_notice','character_video_url']);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: Object.fromEntries((data ?? []).map((x) => [x.key, x.value])) }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function PATCH(request: Request) {
  const c = await context(); if ('error' in c) return c.error;
  let body: { key?: string; value?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON tidak valid.' }, { status: 400 }); }
  const allowed = new Set(['character_video_url', 'site_notice']);
  if (!body.key || !allowed.has(body.key) || body.value === undefined) return NextResponse.json({ error: 'Pengaturan tidak valid.' }, { status: 400 });
  if (body.key === 'character_video_url' && body.value !== '' && (typeof body.value !== 'string' || !/^https:\/\//i.test(body.value) || body.value.length > 2048)) return NextResponse.json({ error: 'URL media harus HTTPS.' }, { status: 400 });
  if (body.key === 'site_notice' && (typeof body.value !== 'string' || body.value.length > 300)) return NextResponse.json({ error: 'Pengumuman maksimal 300 karakter.' }, { status: 400 });
  const { error } = await c.admin.from('site_settings').upsert({ key: body.key, value: body.value, updated_by: c.actorId, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await c.admin.from('audit_logs').insert({ actor_id: c.actorId, action: 'site_setting_update', target_id: body.key, details: { key: body.key } });
  return NextResponse.json({ ok: true });
}

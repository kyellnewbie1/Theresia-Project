import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
async function ownerContext() {
  const session = await createServerSupabase();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: 'Login diperlukan.' }, { status: 401 }) };
  const { data: profile } = await session.from('profiles').select('is_owner').eq('id', user.id).maybeSingle();
  if (!profile?.is_owner) return { error: NextResponse.json({ error: 'Akses owner saja.' }, { status: 403 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum disetel di server Vercel.' }, { status: 503 }) };
  return { admin: createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }), actorId: user.id };
}

export async function GET() {
  const ctx = await ownerContext();
  if ('error' in ctx) return ctx.error;
  const { data, error } = await ctx.admin.from('profiles').select('id,username,display_name,role_label,is_verified,is_owner,created_at').order('created_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  const ctx = await ownerContext();
  if ('error' in ctx) return ctx.error;
  let body: { id?: string; action?: string; value?: boolean; role_label?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON tidak valid.' }, { status: 400 }); }
  if (!body.id || !/^[0-9a-f-]{36}$/i.test(body.id)) return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
  if (body.id === ctx.actorId && body.action === 'owner' && body.value === false) return NextResponse.json({ error: 'Owner tidak dapat mencabut akses owner sendiri melalui panel ini.' }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (body.action === 'verify' && typeof body.value === 'boolean') update.is_verified = body.value;
  else if (body.action === 'role' && typeof body.role_label === 'string' && body.role_label.trim().length >= 1 && body.role_label.trim().length <= 40) update.role_label = body.role_label.trim();
  else if (body.action === 'owner' && typeof body.value === 'boolean') update.is_owner = body.value;
  else return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  const { data, error } = await ctx.admin.from('profiles').update(update).eq('id', body.id).select('id,username,role_label,is_verified,is_owner').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
  await ctx.admin.from('audit_logs').insert({ actor_id: ctx.actorId, action: `profile_${body.action}`, target_id: body.id, details: update });
  return NextResponse.json({ user: data });
}

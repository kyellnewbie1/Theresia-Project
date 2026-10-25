import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase-server';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) return NextResponse.json({ error: 'Server storage belum dikonfigurasi.' }, { status: 503 });
  try {
    const session = await createServerSupabase();
    const { data: { user } } = await session.auth.getUser();
    const { data: file, error } = await session.from('files').select('id,owner_id,file_path,visibility,file_name').eq('id', id).maybeSingle();
    if (error || !file) return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 404 });
    if (file.visibility === 'password') return NextResponse.json({ error: 'File ini memerlukan flow password yang belum tersedia.' }, { status: 403 });
    if (file.visibility !== 'public' && (!user || user.id !== file.owner_id)) return NextResponse.json({ error: 'Tidak memiliki akses.' }, { status: 403 });
    const admin = createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error: signError } = await admin.storage.from('user-files').createSignedUrl(file.file_path, 60, { download: file.file_name });
    if (signError || !data?.signedUrl) return NextResponse.json({ error: 'Gagal membuat link unduhan.' }, { status: 500 });
    return NextResponse.redirect(data.signedUrl, 302);
  } catch { return NextResponse.json({ error: 'Terjadi kesalahan saat memproses unduhan.' }, { status: 500 }); }
}

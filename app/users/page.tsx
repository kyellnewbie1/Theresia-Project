import Link from 'next/link';
import { Search, Users, BadgeCheck, ArrowUpRight } from 'lucide-react';
import { createServerSupabase } from '@/lib/supabase-server';
export const dynamic = 'force-dynamic';
type Profile = { id:string; username:string; display_name:string|null; bio:string|null; avatar_url:string|null; is_verified:boolean; role_label:string|null };
export default async function UsersPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const params = await searchParams;
  const q = (params.q || '').trim().replace(/[,%()\\]/g,'').slice(0,60);
  let profiles:Profile[]=[]; let error=false;
  try {
    const supabase=await createServerSupabase();
    let query=supabase.from('profiles').select('id,username,display_name,bio,avatar_url,is_verified,role_label').order('username',{ascending:true}).limit(40);
    if(q) query=query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    const result=await query;
    if(result.error) throw result.error;
    profiles=(result.data||[]) as Profile[];
  } catch { error=true; }
  return <main className="shell" style={{padding:'52px 0 90px',minHeight:'70vh'}}>
    <div className="muted" style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}><Users size={16}/> COMMUNITY</div>
    <h1 className="section-title" style={{margin:'12px 0'}}>Cari pengguna</h1>
    <p className="muted" style={{lineHeight:1.7}}>Temukan akun Theresia, lihat profil, dan ikuti kreator favoritmu.</p>
    <form action="/users" method="get" className="panel" style={{padding:12,marginTop:22,display:'flex',gap:10,alignItems:'center'}}>
      <Search size={19} className="muted"/><input aria-label="Cari username atau nama" name="q" defaultValue={q} placeholder="Cari username atau nama..." maxLength={60} style={{minWidth:0,flex:1,border:0,outline:'none',background:'transparent',color:'var(--text)',padding:'10px 2px'}}/><button className="btn" type="submit">Cari</button>
      {q&&<Link className="btn secondary" href="/users">Reset</Link>}
    </form>
    {error?<div className="panel" style={{padding:22,marginTop:20}}>Tidak dapat memuat pengguna. Periksa koneksi Supabase dan kebijakan akses profil.</div>:profiles.length===0?<div className="panel" style={{padding:26,marginTop:20,textAlign:'center'}}><Users size={25}/><h3>{q?'Akun tidak ditemukan':'Belum ada akun untuk ditampilkan'}</h3><p className="muted">{q?'Coba kata kunci atau username lain.':'Akun yang tersedia akan muncul di sini.'}</p></div>:<><div className="muted" style={{fontSize:13,margin:'20px 0 12px'}}>{q?`Hasil pencarian untuk “${q}”`:'Pengguna Theresia'} · {profiles.length} akun</div><div className="grid-cards">{profiles.map(p=><article className="panel" key={p.id} style={{padding:18,display:'flex',gap:13,alignItems:'flex-start',minWidth:0}}>{p.avatar_url?<img src={p.avatar_url} alt="" style={{width:54,height:54,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>:<div aria-hidden="true" style={{width:54,height:54,borderRadius:'50%',background:'var(--hover)',display:'grid',placeItems:'center',fontSize:20,flexShrink:0}}>{(p.display_name||p.username||'?').slice(0,1).toUpperCase()}</div>}<div style={{minWidth:0,flex:1}}><Link href={`/u/${encodeURIComponent(p.username)}`} style={{display:'inline-flex',alignItems:'center',gap:5,fontWeight:650,overflowWrap:'anywhere'}}>{p.display_name||p.username}{p.is_verified&&<BadgeCheck size={17} fill="#229df5" color="#ffffff" aria-label="Terverifikasi"/>}</Link><div className="muted" style={{fontSize:13,marginTop:3,overflowWrap:'anywhere'}}>@{p.username}</div><p className="muted" style={{fontSize:13,lineHeight:1.55,margin:'9px 0 12px'}}>{p.bio||'Belum ada bio.'}</p><Link className="btn secondary" href={`/u/${encodeURIComponent(p.username)}`}>Lihat profil <ArrowUpRight size={15}/></Link></div></article>)}</div></>}
  </main>;
}

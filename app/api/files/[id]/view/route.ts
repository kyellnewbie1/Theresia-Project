import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic='force-dynamic';
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({ok:false},{status:503});const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {error}=await admin.rpc('increment_file_views',{p_file_id:id});if(error)return NextResponse.json({ok:false},{status:404});return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}})}

'use client';
import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
export function AnnouncementPopup(){
 const [notice,setNotice]=useState(''); const [open,setOpen]=useState(false);
 useEffect(()=>{let alive=true;(async()=>{try{const r=await fetch('/api/site-settings',{cache:'no-store'});const j=await r.json();const n=typeof j.settings?.site_notice==='string'?j.settings.site_notice.trim():'';if(!alive||!n)return;setNotice(n);if(sessionStorage.getItem('theresia-notice-dismissed')!==n)setOpen(true)}catch{}})();return()=>{alive=false}},[]);
 function close(){setOpen(false);try{sessionStorage.setItem('theresia-notice-dismissed',notice)}catch{}}
 if(!open||!notice)return null;
 return <div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}} style={{position:'fixed',inset:0,zIndex:2000,display:'grid',placeItems:'center',padding:18,background:'rgba(0,0,0,.68)',backdropFilter:'blur(7px)'}}><section role="dialog" aria-modal="true" aria-labelledby="site-announcement-title" className="panel" style={{width:'min(520px,100%)',padding:24,boxShadow:'0 25px 90px rgba(0,0,0,.4)',background:'var(--panel)'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><div style={{display:'flex',alignItems:'center',gap:9}}><Megaphone size={21}/><h2 id="site-announcement-title" style={{fontSize:20,margin:0}}>Pengumuman Theresia</h2></div><button className="btn secondary" aria-label="Tutup pengumuman" onClick={close} style={{padding:8}}><X size={18}/></button></div><p style={{whiteSpace:'pre-wrap',lineHeight:1.75,overflowWrap:'anywhere',margin:'18px 0 22px'}}>{notice}</p><button className="btn" onClick={close} style={{width:'100%'}}>Saya mengerti</button></section></div>
}

import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
export const metadata: Metadata = { title: 'Theresia Project', description: 'A simple space to share code and projects.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body><Navbar />{children}<footer className="shell" style={{padding:'36px 0',marginTop:50,borderTop:'1px solid #27272a',color:'#71717a',fontSize:13,display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><span>© {new Date().getFullYear()} THERESIA PROJECT</span><span>Created by KyZX</span></footer></body></html>; }

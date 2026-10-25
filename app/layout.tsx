import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { ThemeEffects } from '@/components/theme-effects';
export const metadata: Metadata = { title: { default: 'Theresia — Share Your Files', template: '%s | Theresia' }, description: 'Tempat berbagi file, tools, dan project.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body><ThemeEffects /><Navbar />{children}<footer className="shell" style={{padding:'36px 0',marginTop:50,borderTop:'1px solid var(--line)',color:'var(--muted)',fontSize:13,display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><span>© {new Date().getFullYear()} THERESIA PROJECT</span><span>Created by KyZX</span></footer></body></html>; }
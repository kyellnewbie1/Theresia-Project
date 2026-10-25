'use client';
import { useEffect } from 'react';
export function FileViewTracker({fileId}:{fileId:string}){useEffect(()=>{const key=`theresia-viewed-${fileId}`;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');fetch(`/api/files/${fileId}/view`,{method:'POST',keepalive:true}).catch(()=>sessionStorage.removeItem(key))},[fileId]);return null}

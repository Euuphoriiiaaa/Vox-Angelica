import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
export const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
};
export const json = (res, status, body) => {
  res.status(status).json(body);
};
export async function readState() {
  const { data, error } = await supabase.from('vox_state').select('version,payload').eq('id',1).maybeSingle();
  if (error) throw error;
  return data || { version: 0, payload: null };
}
const secret = () => process.env.AUTH_SECRET;
export function issueToken(user) {
  if (!secret()) throw new Error('AUTH_SECRET belum diatur');
  const payload = Buffer.from(JSON.stringify({id:user.id,role:user.role,exp:Date.now()+7*24*60*60*1000})).toString('base64url');
  const sig = crypto.createHmac('sha256',secret()).update(payload).digest('base64url');
  return payload+'.'+sig;
}
export function verifyToken(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i,'') || req.query?.t;
  if (!token || !secret()) return null;
  const [payload,sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256',secret()).update(payload).digest();
  let actual;
  try { actual=Buffer.from(sig,'base64url'); } catch { return null; }
  if (actual.length!==expected.length || !crypto.timingSafeEqual(actual,expected)) return null;
  try {
    const u=JSON.parse(Buffer.from(payload,'base64url').toString());
    return u.exp>Date.now()?u:null;
  } catch { return null; }
}

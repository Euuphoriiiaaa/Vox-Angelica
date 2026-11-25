import { cors, json, readState, issueToken } from './_supabase.js';
export default async function handler(req,res) {
  cors(res); if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
  try {
    const {name,pass}=req.body||{};
    const state=await readState();
    const users=state.payload?.users||[];
    const user=users.find(u=>String(u.name||'').trim().toLowerCase()===String(name||'').trim().toLowerCase() && String(u.pass||'')===String(pass||''));
    if(!user) return json(res,401,{ok:false});
    return json(res,200,{ok:true,id:user.id,tok:issueToken(user)});
  } catch(e) { console.error('api/login',e); return json(res,500,{ok:false,error:'Login server gagal'}); }
}

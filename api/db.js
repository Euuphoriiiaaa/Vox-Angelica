import { supabase, cors, json, readState, verifyToken } from './_supabase.js';
export default async function handler(req,res) {
  cors(res); if(req.method==='OPTIONS') return res.status(204).end();
  try {
    if(req.method==='GET') {
      const state=await readState();
      return json(res,200,{v:state.version,data:state.payload});
    }
    if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
    const user=verifyToken(req);
    if(!user) return json(res,401,{error:'Login diperlukan'});
    const {base,data}=req.body||{};
    if(!data || typeof data!=='object' || Array.isArray(data)) return json(res,400,{error:'Format data tidak valid'});
    const current=await readState();
    if(Number(base)!==Number(current.version)) return json(res,409,{error:'Conflict; muat ulang data',v:current.version});
    const next=current.version+1;
    const {error}=await supabase.from('vox_state').upsert({id:1,version:next,payload:data,updated_at:new Date().toISOString()});
    if(error) throw error;
    return json(res,200,{v:next,data});
  } catch(e) { console.error('api/db',e); return json(res,500,{error:'Database error'}); }
}

import { supabase, cors, json, verifyToken } from './_supabase.js';
export default async function handler(req,res) {
  cors(res); if(req.method==='OPTIONS') return res.status(204).end();
  try {
    if(req.method==='POST') {
      if(!verifyToken(req)) return json(res,401,{error:'Login diperlukan'});
      const {id,data}=req.body||{};
      if(!/^[a-zA-Z0-9_-]{8,80}$/.test(id||'') || typeof data!=='string' || !data.startsWith('data:'))
        return json(res,400,{error:'File tidak valid'});
      const match=data.match(/^data:([^;,]+);base64,(.+)$/);
      if(!match) return json(res,400,{error:'Data file harus base64'});
      const buffer=Buffer.from(match[2],'base64');
      if(buffer.length>8*1024*1024) return json(res,413,{error:'Maksimal file 8 MB'});
      const ext=match[1]==='application/pdf'?'pdf':match[1].startsWith('image/')?'img':'bin';
      const path=`${id}.${ext}`;
      const {error}=await supabase.storage.from('vox-files').upload(path,buffer,{contentType:match[1],upsert:true});
      if(error) throw error;
      return json(res,200,{ok:true});
    }
    if(req.method==='GET') {
      const id=String(req.query.id||'');
      if(!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return json(res,400,{error:'ID file tidak valid'});
      const {data,error}=await supabase.storage.from('vox-files').list('',{search:id});
      if(error) throw error;
      const item=(data||[]).find(x=>x.name.startsWith(id+'.'));
      if(!item) return json(res,404,{error:'File tidak ditemukan'});
      const {data:blob,error:e}=await supabase.storage.from('vox-files').download(item.name);
      if(e) throw e;
      res.setHeader('Content-Type',item.name.endsWith('.pdf')?'application/pdf':item.name.endsWith('.img')?'image/jpeg':'application/octet-stream');
      res.setHeader('Cache-Control','private, max-age=3600');
      return res.status(200).send(Buffer.from(await blob.arrayBuffer()));
    }
    return json(res,405,{error:'Method not allowed'});
  } catch(e) { console.error('api/file',e); return json(res,500,{error:'Storage error'}); }
}

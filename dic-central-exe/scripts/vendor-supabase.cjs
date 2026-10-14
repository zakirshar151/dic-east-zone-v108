const fs=require('node:fs');const path=require('node:path');const https=require('node:https');
const outDir=path.join(__dirname,'..','vendor');const out=path.join(outDir,'supabase.min.js');
const url='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
fs.mkdirSync(outDir,{recursive:true});
const req=https.get(url,res=>{if(res.statusCode!==200){console.error('Supabase download failed:',res.statusCode);process.exit(1);}
const file=fs.createWriteStream(out);res.pipe(file);file.on('finish',()=>{file.close();console.log('Vendored Supabase client:',out);});});
req.on('error',e=>{console.error(e);process.exit(1);});
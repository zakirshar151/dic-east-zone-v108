const fs=require('node:fs');const path=require('node:path');
const src=require.resolve('@supabase/supabase-js/dist/umd/supabase.min.js');
const outDir=path.join(__dirname,'..','vendor');fs.mkdirSync(outDir,{recursive:true});
fs.copyFileSync(src,path.join(outDir,'supabase.min.js'));
console.log('Vendored Supabase client:',src);
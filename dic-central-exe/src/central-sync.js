/* DIC Central Sync - Supabase-backed row-level synchronization.
 * Uses the public publishable key only. Never put a service_role/secret key in the EXE.
 */
(function(){
  const SUPABASE_URL='https://uzoygpyqkdtwwwdqgyff.supabase.co';
  const SUPABASE_KEY='sb_publishable_ZDQnm_UMG0q7zS7o4V0Q_ljjIqjcG';
  const DEVICE_KEY='dic_desktop_device_id_v1';
  let client=null, channel=null, profile=null, ready=false, syncing=false;
  const deviceId=localStorage.getItem(DEVICE_KEY)||crypto.randomUUID(); localStorage.setItem(DEVICE_KEY,deviceId);
  const baseline=new Map();
  const statusEl=()=>document.getElementById('dicCloudStatus');
  function status(text,kind){const e=statusEl();if(!e)return;e.textContent=text;e.dataset.kind=kind||'neutral';}
  function setDot(kind){const d=document.getElementById('dicCloudDot');if(d)d.className='dic-dot '+(kind||'');const s=statusEl();if(s)s.className=kind==='ok'?'dic-ok':kind==='bad'?'dic-bad':'dic-warn';}
  function uidForRow(r){if(r&&r._DIC_ID)return String(r._DIC_ID);const id=crypto.randomUUID();if(r)r._DIC_ID=id;return id;}
  function rowPayload(r){const copy={...r};copy._DIC_ID=uidForRow(copy);copy._UPDATED_AT=copy._UPDATED_AT||new Date().toISOString();return copy;}
  function remember(r){const p=rowPayload(r);baseline.set(p._DIC_ID,{...p});}
  function changed(a,b){return JSON.stringify(a)!==JSON.stringify(b);}
  function addUi(){
    if(document.getElementById('dicCentralPanel'))return;
    const style=document.createElement('style');style.textContent=`
      #dicCentralPanel{position:fixed;right:18px;bottom:18px;z-index:99999;background:#fff;border:1px solid #dfe5ee;border-radius:12px;box-shadow:0 8px 30px #0002;padding:10px 12px;display:flex;align-items:center;gap:8px;font:12px Segoe UI,Arial;max-width:360px}
      #dicCloudStatus{font-weight:700}.dic-ok{color:#15803d}.dic-warn{color:#b45309}.dic-bad{color:#b91c1c}
      #dicCentralPanel button{padding:7px 10px;border-radius:8px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer}
      #dicCentralPanel button.secondary{background:#475467}.dic-dot{width:9px;height:9px;border-radius:50%;background:#b45309;display:inline-block}.dic-dot.ok{background:#15803d}.dic-dot.bad{background:#b91c1c}
      #dicAuthModal{position:fixed;inset:0;background:#0008;z-index:100000;display:none;align-items:center;justify-content:center}
      #dicAuthModal .box{width:min(420px,92vw);background:#fff;border-radius:16px;padding:22px;box-shadow:0 20px 60px #0004}
      #dicAuthModal input{width:100%;margin:7px 0;padding:10px;border:1px solid #dfe5ee;border-radius:9px;box-sizing:border-box}
      #dicAuthModal .actions{display:flex;gap:8px;margin-top:12px}.dic-note{font-size:12px;color:#667085;line-height:1.45}
    `;document.head.appendChild(style);
    const p=document.createElement('div');p.id='dicCentralPanel';p.innerHTML='<span class="dic-dot" id="dicCloudDot"></span><span id="dicCloudStatus">Central Sync: checking…</span><button id="dicCloudLogin">Login</button>';document.body.appendChild(p);
    const m=document.createElement('div');m.id='dicAuthModal';m.innerHTML=`<div class="box"><h3 style="margin:0 0 8px">DIC Central Database</h3><div class="dic-note">Sign in with the Supabase account assigned to this DIC workstation. New accounts are not created from this screen so station permissions cannot be self-assigned.</div><input id="dicEmail" type="email" placeholder="Email"><input id="dicPassword" type="password" placeholder="Password"><div class="actions"><button id="dicSignIn">Sign In</button><button class="secondary" id="dicCloseAuth">Cancel</button></div><div id="dicAuthMsg" class="dic-note" style="margin-top:10px"></div></div>`;document.body.appendChild(m);
    document.getElementById('dicCloudLogin').onclick=()=>m.style.display='flex';document.getElementById('dicCloseAuth').onclick=()=>m.style.display='none';document.getElementById('dicSignIn').onclick=signin;
  }
  async function signin(){const msg=document.getElementById('dicAuthMsg');msg.textContent='Signing in…';try{const {data,error}=await client.auth.signInWithPassword({email:document.getElementById('dicEmail').value.trim(),password:document.getElementById('dicPassword').value});if(error)throw error;document.getElementById('dicAuthModal').style.display='none';await initForUser(data.user);}catch(e){msg.textContent=e.message||String(e);setDot('bad');status('Login failed','bad');}}
  async function loadProfile(user){const {data,error}=await client.from('dic_profiles').select('*').eq('user_id',user.id).maybeSingle();if(error)throw error;if(!data||!data.is_active)throw new Error('DIC profile is not assigned/active. Ask the DIC administrator to assign this account to a district and police station.');profile=data;return data;}
  async function loadCloud(){
    const {data,error}=await client.from('dic_cases').select('*').is('deleted_at',null).order('updated_at',{ascending:true});if(error)throw error;
    const byId=new Map();(data||[]).forEach(x=>{const r={...(x.data||{})};r._DIC_ID=x.id;r._UPDATED_AT=x.updated_at;byId.set(x.id,r);remember(r);});
    const arr=window.__dicGetData();let changedLocal=false;const localById=new Map(arr.map(r=>[uidForRow(r),r]));
    byId.forEach((r,id)=>{const local=localById.get(id);if(!local){arr.push(r);changedLocal=true;}else if(String(local._UPDATED_AT||'')<String(r._UPDATED_AT||'')){Object.assign(local,r);changedLocal=true;}});
    if(profile.role==='agent'){for(let i=arr.length-1;i>=0;i--){const r=arr[i];if(String(r.DISTRICT||'')!==String(profile.district||'')||String(r['POLICE STATION']||'')!==String(profile.police_station||''))arr.splice(i,1);}}
    if(changedLocal){try{window.render();}catch(_){}try{window.dicSaveMainData();}catch(_){}}
    arr.forEach(r=>{if(!baseline.has(uidForRow(r)))remember(r);});
  }
  async function upsertRow(r){if(!ready||!profile)return false;const p=rowPayload(r);p._UPDATED_AT=new Date().toISOString();r._DIC_ID=p._DIC_ID;r._UPDATED_AT=p._UPDATED_AT;const row={id:p._DIC_ID,district:r.DISTRICT||profile.district||'',police_station:r['POLICE STATION']||profile.police_station||'',case_number:r['L.C NO']||'',title:r['CASE TITLE']||'Mobile Case',data:p,created_by:profile.user_id,updated_by:profile.user_id,device_id:deviceId,updated_at:p._UPDATED_AT};const {error}=await client.from('dic_cases').upsert(row,{onConflict:'id'});if(error)throw error;remember(p);return true;}
  async function syncChanges(){if(!ready||syncing)return;syncing=true;try{const current=new Map();for(const r of window.__dicGetData()){if(profile.role==='agent'&&(String(r.DISTRICT||'')!==String(profile.district||'')||String(r['POLICE STATION']||'')!==String(profile.police_station||'')))continue;const p=rowPayload(r);current.set(p._DIC_ID,p);const old=baseline.get(p._DIC_ID);if(!old||changed({...old,_UPDATED_AT:undefined},{...p,_UPDATED_AT:undefined}))await upsertRow(r);}status('Central Sync: saved','ok');setDot('ok');}catch(e){console.warn('DIC central sync failed',e);status('Central Sync: offline / retry on save','warn');setDot('');}finally{syncing=false;}}
  function hookSave(){const original=window.save;if(typeof original!=='function'||original.__dicCentralHook)return;const wrapped=function(){const out=original.apply(this,arguments);setTimeout(syncChanges,150);return out;};wrapped.__dicCentralHook=true;window.save=wrapped;}
  async function subscribe(){if(channel)await client.removeChannel(channel);channel=client.channel('dic-cases-live').on('postgres_changes',{event:'*',schema:'public',table:'dic_cases'},payload=>{const incoming=payload.new;if(!incoming?.id)return;const r=incoming.data||{};r._DIC_ID=incoming.id;r._UPDATED_AT=incoming.updated_at;const arr=window.__dicGetData();const local=arr.find(x=>uidForRow(x)===incoming.id);if(incoming.deleted_at){if(local){const i=arr.indexOf(local);if(i>=0)arr.splice(i,1);try{window.render();}catch(_){}try{window.dicSaveMainData();}catch(_){}}baseline.delete(incoming.id);return;}if(profile.role==='agent'&&(String(r.DISTRICT||'')!==String(profile.district||'')||String(r['POLICE STATION']||'')!==String(profile.police_station||'')))return;if(!local)arr.push(r);else if(String(local._UPDATED_AT||'')<String(incoming.updated_at||''))Object.assign(local,r);remember(r);try{window.dicSaveMainData();window.render();}catch(_){};});channel.subscribe(s=>{if(s==='SUBSCRIBED'){status('Central Sync: live','ok');setDot('ok')}else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT'){status('Central Sync: reconnecting','warn');setDot('')}});}
  async function initForUser(user){try{await loadProfile(user);ready=true;status('Central Sync: loading…','ok');setDot('ok');await loadCloud();hookSave();await syncChanges();await subscribe();}catch(e){ready=false;status(e.message||'Central Sync unavailable','bad');setDot('bad');console.warn(e);}}
  async function init(){addUi();if(!window.supabase?.createClient){status('Central Sync library missing','bad');setDot('bad');return;}client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data}=await client.auth.getSession();if(data?.session?.user)await initForUser(data.session.user);else{status('Central Sync: login required','warn');setDot('');}client.auth.onAuthStateChange((_event,session)=>{if(session?.user&&!ready)setTimeout(()=>initForUser(session.user),0);});}
  window.dicCentralSync={init,syncChanges};
})();
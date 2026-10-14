/* DIC Manual Investigation Workbench — configurable local-only case data */
(function () {
  'use strict';
  if (window.__dicManualWorkbenchLoaded) return;
  window.__dicManualWorkbenchLoaded = true;
  var KEY = 'dic_manual_investigation_workbench_v1';
  var groups = [
    { title:'Case / Number Details', fields:['Prime Number','Target Number','Accused Number','Location','IMEI Number','Subscriber Information','Status','CNIC Number'] },
    { title:'CNIC Results by Company', fields:['CNIC Result — Jazz / Warid','CNIC Result — Telenor','CNIC Result — Ufone','CNIC Result — Zong'] },
    { title:'IMEI Results by Company', fields:['IMEI Result — Zong','IMEI Result — Jazz / Warid','IMEI Result — Telenor','IMEI Result — Ufone'] }
  ];
  function uid(){ return 'mw'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function readState(){ try{var x=JSON.parse(localStorage.getItem(KEY)||'{"records":[]}');return x&&Array.isArray(x.records)?x:{records:[]};}catch(e){return {records:[]};} }
  var state=readState(), activeId=null, values={}, extras=[], repeats={};
  function saveState(){localStorage.setItem(KEY,JSON.stringify(state));}
  function byId(id){return document.getElementById(id);}
  function setStatus(msg){byId('mwStatus').textContent=msg;}
  var css=[
    '#dicMwLaunch{position:fixed;right:18px;bottom:78px;z-index:99990;border:0;border-radius:12px;background:#0f766e;color:#fff;padding:12px 16px;font-weight:800;box-shadow:0 5px 18px #0003;cursor:pointer}',
    '#dicMwOverlay{position:fixed;inset:0;z-index:99999;background:#0b1220a8;display:none;align-items:center;justify-content:center;padding:12px}',
    '#dicMw{width:min(1200px,98vw);height:min(92vh,900px);background:#f5f8fc;border-radius:16px;box-shadow:0 20px 60px #0005;display:flex;flex-direction:column;overflow:hidden;color:#172033;font:14px/1.4 Segoe UI,Arial,sans-serif}',
    '#dicMw *{box-sizing:border-box} #dicMw .mwHead{background:#102a43;color:#fff;padding:15px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px}',
    '#dicMw .mwHead h2{font-size:20px;margin:0} #dicMw .mwActions{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;background:#fff;border-bottom:1px solid #dfe5ee}',
    '#dicMw button{cursor:pointer} #dicMw .mwBtn{border:1px solid #cbd5e1;background:#fff;color:#172033;border-radius:8px;padding:8px 11px;font-weight:700}',
    '#dicMw .primary{background:#2563eb!important;color:#fff!important;border-color:#2563eb!important} #dicMw .danger{color:#b91c1c!important;border-color:#fecaca!important}',
    '#dicMw .mwBody{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:0;flex:1} #dicMw .mwRecords{border-right:1px solid #dfe5ee;background:#fff;overflow:auto;padding:12px} #dicMw .mwEditor{overflow:auto;padding:16px}',
    '#dicMw .mwCard{background:#fff;border:1px solid #dfe5ee;border-radius:12px;padding:13px;margin-bottom:12px} #dicMw .mwCard h3{font-size:15px;margin:0 0 12px;color:#102a43}',
    '#dicMw .mwGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px} #dicMw .mwField{min-width:0;border:1px solid #e2e8f0;border-radius:9px;padding:9px;background:#fbfdff}',
    '#dicMw .mwField label{display:block;font-weight:700;margin-bottom:6px;font-size:12px;color:#334155} #dicMw .mwField textarea,#dicMw .mwField input{display:block;width:100%;min-height:40px;border:1px solid #cbd5e1;border-radius:7px;padding:9px;font:13px Segoe UI,Arial,sans-serif;background:#fff;color:#172033}',
    '#dicMw .mwField textarea{min-height:74px;resize:vertical} #dicMw .mwTools{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap} #dicMw .mwMini{border:1px solid #cbd5e1;border-radius:6px;background:#fff;padding:4px 7px;font-size:11px}',
    '#dicMw .mwRecord{display:block;width:100%;text-align:left;background:#fff;border:1px solid #e2e8f0;border-radius:9px;padding:10px;margin:0 0 8px;color:#172033} #dicMw .mwRecord.active{border-color:#2563eb;background:#eff6ff}',
    '#dicMw .mwRecord strong{display:block;overflow-wrap:anywhere} #dicMw .mwRecord small,#dicMw .mwMuted{color:#64748b;font-size:12px} #dicMw .mwSearch{width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px}',
    '#dicMw .mwCustom{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px} #dicMw .mwCustom input{flex:1;min-width:170px;padding:9px;border:1px solid #cbd5e1;border-radius:8px} #dicMw .mwEmpty{padding:15px;text-align:center;color:#64748b}',
    '@media(max-width:760px){#dicMwOverlay{padding:3px}#dicMw{height:96vh;width:100vw}#dicMw .mwBody{grid-template-columns:1fr;grid-template-rows:155px minmax(0,1fr)}#dicMw .mwRecords{border-right:0;border-bottom:1px solid #dfe5ee}#dicMw .mwGrid{grid-template-columns:1fr}}'
  ].join('\n');
  var style=document.createElement('style');style.id='dicMwStyle';style.textContent=css;document.head.appendChild(style);
  var launch=document.createElement('button');launch.id='dicMwLaunch';launch.textContent='＋ Manual Investigation Data';launch.title='Open configurable manual investigation fields';document.body.appendChild(launch);
  var overlay=document.createElement('div');overlay.id='dicMwOverlay';
  overlay.innerHTML='<section id="dicMw" role="dialog" aria-modal="true" aria-label="Manual Investigation Data">'+
    '<header class="mwHead"><div><h2>Manual Investigation Data</h2><div style="font-size:12px;opacity:.85">Custom fields • multiple entries • local save • export / import</div></div><button class="mwBtn" id="mwClose">✕ Close</button></header>'+
    '<div class="mwActions"><button class="mwBtn primary" id="mwNew">＋ New Entry</button><button class="mwBtn" id="mwSave">💾 Save Entry</button><button class="mwBtn" id="mwAddField">＋ Add Custom Field</button><button class="mwBtn" id="mwExport">⬇ Export JSON</button><button class="mwBtn" id="mwExportCsv">⬇ Export CSV</button><button class="mwBtn" id="mwImport">⬆ Import JSON</button><button class="mwBtn danger" id="mwDelete" style="margin-left:auto">Delete Entry</button><input type="file" id="mwImportFile" accept=".json,application/json" hidden></div>'+
    '<div class="mwBody"><aside class="mwRecords"><input class="mwSearch" id="mwSearch" placeholder="Search name, number, IMEI, CNIC, status…"><div class="mwMuted" id="mwRecordCount"></div><div id="mwRecordList"></div></aside>'+
    '<main class="mwEditor"><div class="mwCard"><h3>Entry Reference</h3><div class="mwGrid"><div class="mwField"><label for="mwTitle">Entry title / case reference</label><input id="mwTitle" placeholder="e.g. FIR / L.C No, complainant or case ref"></div><div class="mwField"><label for="mwLinkedCase">Existing DIC case reference (optional)</label><input id="mwLinkedCase" placeholder="Name, L.C/FIR, master number"></div></div><p class="mwMuted">Yeh workbench existing DIC case ko automatically overwrite nahi karta. Data isi browser/device mein local save hota hai; central sync alag se configured nahi hai.</p></div><div id="mwFields"></div>'+
    '<div class="mwCard"><h3>Custom Field</h3><div class="mwCustom"><input id="mwCustomName" placeholder="Naye box ka naam, e.g. CDR Notes"><button class="mwBtn primary" id="mwCreateCustom">Add Box</button></div><p class="mwMuted">Jitne chahein extra boxes add karein. Har field ke “Add another box” se usi field ki multiple entries bhi bana sakte hain.</p></div><div id="mwStatus" class="mwMuted" role="status"></div></main></div></section>';
  document.body.appendChild(overlay);
  function defs(){var out=[];groups.forEach(function(g){g.fields.forEach(function(label){out.push({id:'d_'+label,label:label,group:g.title,builtin:true});});});return out.concat(extras);}
  function readInputs(){var out={};overlay.querySelectorAll('[data-mw-field]').forEach(function(el){var k=el.getAttribute('data-mw-field');(out[k]||(out[k]=[])).push(el.value);});return out;}
  function renderFieldInstances(grid,def,removable){
    var count=Math.max(1,Number(repeats[def.id]||(values[def.id]||[]).length||1));
    for(var i=0;i<count;i++){
      var box=document.createElement('div');box.className='mwField';
      var html='<label>'+esc(def.label)+(count>1?' ('+(i+1)+')':'')+'</label><textarea data-mw-field="'+esc(def.id)+'" placeholder="'+esc(def.label)+' — detail enter karein"></textarea><div class="mwTools"><button type="button" class="mwMini" data-add-instance="'+esc(def.id)+'">＋ Add another box</button>';
      if(i>0)html+='<button type="button" class="mwMini" data-remove-instance="'+esc(def.id)+'">− Remove this box</button>';
      if(removable&&i===0)html+='<button type="button" class="mwMini" data-remove-field="'+esc(def.id)+'">Delete field</button>';
      box.innerHTML=html+'</div>';grid.appendChild(box);
    }
  }
  function renderFields(){
    var target=byId('mwFields');target.innerHTML='';
    groups.forEach(function(g){var card=document.createElement('section');card.className='mwCard';card.innerHTML='<h3>'+esc(g.title)+'</h3><div class="mwGrid"></div>';var grid=card.querySelector('.mwGrid');g.fields.forEach(function(label){renderFieldInstances(grid,{id:'d_'+label,label:label},false);});target.appendChild(card);});
    if(extras.length){var card2=document.createElement('section');card2.className='mwCard';card2.innerHTML='<h3>Additional Custom Fields</h3><div class="mwGrid"></div>';extras.forEach(function(def){renderFieldInstances(card2.querySelector('.mwGrid'),def,true);});target.appendChild(card2);}
    Object.keys(values).forEach(function(k){var els=target.querySelectorAll('[data-mw-field="'+CSS.escape(k)+'"]');(values[k]||[]).forEach(function(v,i){if(els[i])els[i].value=v;});});
  }
  function renderRecords(){
    var q=byId('mwSearch').value.trim().toLowerCase(),list=byId('mwRecordList');list.innerHTML='';
    var found=state.records.filter(function(r){return !q||JSON.stringify(r).toLowerCase().indexOf(q)>=0;});
    byId('mwRecordCount').textContent=found.length+' saved entries';
    if(!found.length){list.innerHTML='<div class="mwEmpty">Abhi koi saved entry nahi.</div>';return;}
    found.slice().reverse().forEach(function(r){var b=document.createElement('button');b.className='mwRecord'+(r.id===activeId?' active':'');b.innerHTML='<strong>'+esc(r.title||'Untitled Entry')+'</strong><small>'+esc(r.linkedCase||'No linked case')+'<br>'+esc(r.updatedAt||'')+'</small>';b.addEventListener('click',function(){openRecord(r.id);});list.appendChild(b);});
  }
  function resetForm(){activeId=null;values={};repeats={};byId('mwTitle').value='';byId('mwLinkedCase').value='';renderFields();renderRecords();byId('mwStatus').textContent='New entry — data enter karke Save Entry karein.';}
  function openRecord(id){var r=state.records.find(function(x){return x.id===id;});if(!r)return;activeId=id;values=JSON.parse(JSON.stringify(r.values||{}));extras=JSON.parse(JSON.stringify(r.extraFields||[]));repeats={};Object.keys(values).forEach(function(k){if(values[k].length>1)repeats[k]=values[k].length;});byId('mwTitle').value=r.title||'';byId('mwLinkedCase').value=r.linkedCase||'';renderFields();renderRecords();byId('mwStatus').textContent='Saved entry loaded. Changes ke baad Save Entry karein.';}
  function saveEntry(){var r={id:activeId||uid(),title:byId('mwTitle').value.trim(),linkedCase:byId('mwLinkedCase').value.trim(),values:readInputs(),extraFields:JSON.parse(JSON.stringify(extras)),updatedAt:new Date().toLocaleString(),version:1};var i=state.records.findIndex(function(x){return x.id===r.id;});if(i>=0)state.records[i]=r;else state.records.push(r);activeId=r.id;try{saveState();renderRecords();byId('mwStatus').textContent='Saved successfully on this device.';}catch(e){byId('mwStatus').textContent='Save failed: '+(e.message||e);}}
  function addField(label){label=String(label||'').trim();if(!label){byId('mwStatus').textContent='Pehle field ka naam likhein.';return;}extras.push({id:uid(),label:label,group:'Additional Custom Fields',builtin:false});renderFields();byId('mwStatus').textContent='Field added: '+label;}
  function blobDownload(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);}
  function exportJson(){blobDownload(new Blob([JSON.stringify({app:'DIC Manual Investigation Workbench',version:1,exportedAt:new Date().toISOString(),records:state.records},null,2)],{type:'application/json'}),'DIC_Manual_Investigation_Backup.json');}
  function cell(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}
  function exportCsv(){var keys=new Set(),labels={};defs().forEach(function(d){labels[d.id]=d.label;});state.records.forEach(function(r){Object.keys(r.values||{}).forEach(function(k){keys.add(k);});(r.extraFields||[]).forEach(function(f){labels[f.id]=f.label;});});var ordered=Array.from(keys),head=['Entry Title','Linked DIC Case','Updated At'].concat(ordered.map(function(k){return labels[k]||k;}));var lines=[head.map(cell).join(',')];state.records.forEach(function(r){lines.push([r.title,r.linkedCase,r.updatedAt].concat(ordered.map(function(k){return (r.values[k]||[]).filter(Boolean).join(' | ');})).map(cell).join(','));});blobDownload(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),'DIC_Manual_Investigation_Data.csv');}
  function importJson(file){file.text().then(function(text){var parsed=JSON.parse(text),records=Array.isArray(parsed)?parsed:parsed.records;if(!Array.isArray(records))throw new Error('JSON mein records array nahi mila.');records.forEach(function(r){if(!r.id)r.id=uid();if(!r.values||typeof r.values!=='object')r.values={};});var map=new Map(state.records.map(function(r){return [r.id,r];}));records.forEach(function(r){map.set(r.id,r);});state.records=Array.from(map.values());saveState();renderRecords();byId('mwStatus').textContent=records.length+' entries imported/merged.';}).catch(function(e){byId('mwStatus').textContent='Import failed: '+(e.message||e);});}
  launch.addEventListener('click',function(){overlay.style.display='flex';renderRecords();if(!activeId)resetForm();});
  byId('mwClose').addEventListener('click',function(){overlay.style.display='none';});
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.style.display='none';});
  byId('mwNew').addEventListener('click',resetForm);byId('mwSave').addEventListener('click',saveEntry);
  byId('mwAddField').addEventListener('click',function(){byId('mwCustomName').focus();byId('mwStatus').textContent='Custom Field mein naam likh kar Add Box dabayein.';});
  byId('mwCreateCustom').addEventListener('click',function(){addField(byId('mwCustomName').value);byId('mwCustomName').value='';});
  byId('mwSearch').addEventListener('input',renderRecords);byId('mwExport').addEventListener('click',exportJson);byId('mwExportCsv').addEventListener('click',exportCsv);
  byId('mwImport').addEventListener('click',function(){byId('mwImportFile').click();});
  byId('mwImportFile').addEventListener('change',function(e){if(e.target.files&&e.target.files[0])importJson(e.target.files[0]);e.target.value='';});
  byId('mwDelete').addEventListener('click',function(){if(!activeId){byId('mwStatus').textContent='Delete ke liye pehle saved entry select karein.';return;}if(!confirm('Is saved manual entry ko delete karna hai?'))return;state.records=state.records.filter(function(r){return r.id!==activeId;});saveState();resetForm();byId('mwStatus').textContent='Entry deleted.';});
  overlay.addEventListener('click',function(e){
    var add=e.target.closest('[data-add-instance]');if(add){values=readInputs();var k=add.getAttribute('data-add-instance');repeats[k]=(repeats[k]||((values[k]||[]).length)||1)+1;renderFields();return;}
    var rem=e.target.closest('[data-remove-instance]');if(rem){values=readInputs();var rk=rem.getAttribute('data-remove-instance'),arr=values[rk]||[];if(arr.length>1)arr.pop();values[rk]=arr;repeats[rk]=Math.max(1,arr.length);renderFields();return;}
    var del=e.target.closest('[data-remove-field]');if(del){var dk=del.getAttribute('data-remove-field');if(!confirm('Custom field ko form se delete karna hai?'))return;extras=extras.filter(function(f){return f.id!==dk;});delete values[dk];delete repeats[dk];renderFields();byId('mwStatus').textContent='Field removed from form. Save entry to store changes.';}
  });
  renderFields();renderRecords();
})();
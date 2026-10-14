/* DIC v19 UI fixes: live search suggestions, per-record IMEI cleanup, reliable row edit. */
(() => {
  if (window.__dicV19UiFixes) return;
  window.__dicV19UiFixes = true;

  const getData = () => {
    try { return (0, eval)('data'); } catch (_) { return null; }
  };
  const getFields = () => {
    try { return (0, eval)('fields'); } catch (_) { return []; }
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function cleanImeiCell(value) {
    const source = String(value ?? '').trim();
    if (!source) return '';
    const tokens = source.split(/[\n\r,;|]+/).flatMap(part => {
      const text = String(part).trim();
      if (!text) return [];
      const digits = text.replace(/\D/g, '');
      if (!digits) return [];
      // Split concatenated full IMEIs (e.g. 30 digits) into 15-digit entries.
      if (digits.length > 15 && digits.length % 15 === 0) {
        const chunks = [];
        for (let i = 0; i < digits.length; i += 15) chunks.push(digits.slice(i, i + 15));
        return chunks;
      }
      // If a pasted cell contains spaces between numbers, split those too.
      const runs = text.match(/\d{14,15}/g);
      if (runs && runs.join('').length === digits.length) return runs;
      return [digits];
    });
    const seen = new Set();
    return tokens.map(x => x.trim()).filter(x => {
      if (!x || seen.has(x)) return false;
      seen.add(x);
      return true;
    }).join('\n');
  }

  function cleanAllImeis() {
    const rows = getData();
    if (!Array.isArray(rows)) return false;
    let changed = false;
    rows.forEach(row => {
      if (!row || typeof row !== 'object') return;
      const key = Object.keys(row).find(k => k.trim().toUpperCase() === 'IMEI');
      if (!key) return;
      const cleaned = cleanImeiCell(row[key]);
      if (cleaned !== String(row[key] ?? '').trim()) {
        row[key] = cleaned;
        changed = true;
      }
    });
    if (changed) {
      try { (0, eval)('save()'); } catch (_) {}
      try { (0, eval)('render()'); } catch (_) {}
      try {
        const district = (0, eval)('selectedDistrict');
        const station = (0, eval)('selectedStation');
        if (district && station) (0, eval)('renderStationRecords(selectedDistrict, selectedStation)');
      } catch (_) {}
    }
    return changed;
  }

  function ensureSuggestions() {
    const input = document.getElementById('search');
    if (!input || document.getElementById('dicV19LiveSuggestions')) return;
    const host = input.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const box = document.createElement('div');
    box.id = 'dicV19LiveSuggestions';
    Object.assign(box.style, {
      display:'none', position:'absolute', left:'0', right:'0', top:'100%',
      zIndex:'100000', background:'#fff', border:'1px solid #cbd5e1',
      borderRadius:'10px', boxShadow:'0 8px 24px #0002', maxHeight:'320px',
      overflowY:'auto', color:'#102a43', textAlign:'left'
    });
    host.appendChild(box);

    function getSuggestions(query) {
      const rows = getData();
      if (!Array.isArray(rows)) return [];
      const q = query.trim().toLocaleLowerCase();
      if (!q) return [];
      const allFields = getFields();
      const found = [];
      const seen = new Set();
      rows.forEach((row, index) => {
        if (!row || typeof row !== 'object') return;
        const values = allFields.length ? allFields : Object.keys(row);
        const matches = values.map(key => ({ key, value: String(row[key] ?? '').trim() }))
          .filter(x => x.value && x.value.toLocaleLowerCase().includes(q));
        if (!matches.length) return;
        const name = row['COMPLAINANT NAME'] || row['NAME'] || row['SUBSCRIBER NAME'] || '';
        const lc = row['L.C NO'] || row['FIR / L.C NO'] || row['FIR NO'] || '';
        const master = row['MASTER NUMBER'] || row['MSISDN'] || '';
        const imei = cleanImeiCell(row['IMEI']).split('\n').filter(Boolean).join(', ');
        const label = [name, lc ? 'L.C: ' + lc : '', master ? 'Number: ' + master : '', imei ? 'IMEI: ' + imei : '']
          .filter(Boolean).join(' • ');
        const key = String(index) + '|' + label;
        if (seen.has(key)) return;
        seen.add(key);
        found.push({ index, label: label || matches.slice(0,2).map(x=>x.value).join(' • '), matched: matches.slice(0,2).map(x=>x.key + ': ' + x.value).join(' • ') });
      });
      return found.slice(0, 30);
    }

    function renderSuggestions() {
      const q = input.value.trim();
      if (!q) { box.style.display='none'; box.innerHTML=''; return; }
      const list = getSuggestions(q);
      box.innerHTML = '';
      if (!list.length) {
        box.innerHTML = '<div style="padding:10px 12px;color:#667085">Koi matching naam ya number nahi mila.</div>';
      } else {
        list.forEach(item => {
          const button = document.createElement('button');
          button.type = 'button';
          button.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 12px;border:0;border-bottom:1px solid #edf1f5;border-radius:0;background:#fff;color:#102a43;white-space:normal;cursor:pointer';
          button.innerHTML = '<div style="font-weight:700">' + esc(item.label) + '</div><div style="font-size:11px;color:#667085;margin-top:3px">' + esc(item.matched) + '</div>';
          button.addEventListener('mouseenter', () => button.style.background='#eff6ff');
          button.addEventListener('mouseleave', () => button.style.background='#fff');
          button.addEventListener('mousedown', event => event.preventDefault());
          button.addEventListener('click', () => {
            try { (0, eval)('dicSetSearchMode("ALL")'); } catch (_) {}
            input.value = q;
            input.dispatchEvent(new Event('input', { bubbles:true }));
            box.style.display='none';
            setTimeout(() => {
              let row = document.querySelector('#body tr[data-index="' + item.index + '"], #stationRecordBody tr[data-index="' + item.index + '"]');
              if (!row) {
                try { (0, eval)('render()'); } catch (_) {}
                row = document.querySelector('#body tr[data-index="' + item.index + '"], #stationRecordBody tr[data-index="' + item.index + '"]');
              }
              if (row) {
                row.scrollIntoView({ block:'center', behavior:'smooth' });
                row.style.outline='3px solid #f59e0b';
                setTimeout(() => { row.style.outline=''; }, 1800);
              }
            }, 80);
          });
          box.appendChild(button);
        });
      }
      box.style.display='block';
    }
    input.addEventListener('input', renderSuggestions);
    input.addEventListener('focus', renderSuggestions);
    document.addEventListener('click', event => {
      if (!host.contains(event.target)) box.style.display='none';
    });
  }

  function bindRowEdit() {
    document.querySelectorAll('#body tr[data-index], #stationRecordBody tr[data-index]').forEach(row => {
      if (row.dataset.dicV19EditBound === '1') return;
      row.dataset.dicV19EditBound = '1';
      row.style.cursor = 'pointer';
      row.title = 'Click case row to edit its data';
      row.addEventListener('click', event => {
        if (event.target.closest('button,a,input,textarea,select,[contenteditable="true"]')) return;
        const edit = row.querySelector('.edit-row, button[title*="Edit"], button');
        if (edit && /edit/i.test(edit.textContent || edit.title || '')) {
          edit.click();
          return;
        }
        try {
          const fn = (0, eval)('startRowEdit');
          if (typeof fn === 'function') fn(row);
        } catch (_) {}
      });
    });
  }

  function install() {
    ensureSuggestions();
    cleanAllImeis();
    bindRowEdit();
  }

  // Run once after startup and again when table rows are redrawn/imported.
  install();
  const observer = new MutationObserver(() => {
    ensureSuggestions();
    bindRowEdit();
  });
  observer.observe(document.body, { childList:true, subtree:true });
  window.addEventListener('beforeunload', () => {
    try { cleanAllImeis(); } catch (_) {}
  });
})();
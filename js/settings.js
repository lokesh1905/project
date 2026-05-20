// ====================== SETTINGS (EXPORT/IMPORT/THEME) ======================
window.exportData = function() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(window.items, null, 2)], { type: 'application/json' }));
  a.download = 'shop-rates.json';
  a.click();
};

window.exportExcel = function() {
  if (typeof XLSX === 'undefined') return window.showToast('Excel lib not ready');
  const ws = XLSX.utils.json_to_sheet(window.items.map(i => ({ Name: i.name, Brand: i.brand, Buy: i.buyPrice, Sell: i.sellPrice, Category: i.cat })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Items');
  XLSX.writeFile(wb, 'electric-shop.xlsx');
};

window.importData = function(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data)) {
        window.items = data;
        window.saveToDB();
        window.renderAll();
        window.showToast(`Imported ${data.length} items`);
      }
    } catch (err) {
      window.showToast('Invalid JSON');
    }
  };
  r.readAsText(f);
};

window.clearAll = function() {
  if (confirm('Delete EVERYTHING?')) {
    window.items = [];
    window.saveToDB();
    window.renderAll();
    window.showToast('All cleared');
  }
};

window.setTheme = function(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('ratebook_theme', t);
};

window.openEdit = function(id) {
  window.editingId = id;
  let i = window.items.find(item => item.id === id);
  if (!i) return;
  document.getElementById('editName').value = (i.name || '').toUpperCase();
  document.getElementById('editBrand').value = (i.brand || '').toUpperCase();
  document.getElementById('editBuyPrice').value = i.buyPrice;
  document.getElementById('editSellPrice').value = i.sellPrice || 0;
  document.getElementById('editUnit').value = (i.unit || '').toUpperCase();
  document.getElementById('editCat').value = (i.cat || '').toUpperCase();
  document.getElementById('editDistributor').value = (i.distributor || '').toUpperCase();
  document.getElementById('editLocation').value = (i.location || '').toUpperCase();
  document.getElementById('editNote').value = i.note || '';
  document.getElementById('editReason').value = '';
  window.checkSellWarn('edit');
  document.getElementById('editModal').classList.add('active');
  setTimeout(() => window.setupAutoUppercase(), 100);
};

window.closeEdit = function() {
  document.getElementById('editModal').classList.remove('active');
  window.editingId = null;
};

window.openDetail = function(id) {
  const i = window.items.find(x => x.id === id);
  if (!i) { window.showToast("Item not found", "#c0392b"); return; }
  let historyHtml = '';
  if (Array.isArray(i.priceHistory) && i.priceHistory.length > 0) {
    historyHtml += '<div style="margin-top:16px;margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);">Price History</div>';
    historyHtml += '<div style="display:flex;flex-direction:column;gap:6px;">';
    for (let h = 0; h < i.priceHistory.length; h++) {
      const entry = i.priceHistory[h];
      const arrow = entry.type === 'up' ? '▲' : entry.type === 'down' ? '▼' : '●';
      const arrowColor = entry.type === 'up' ? 'var(--danger)' : entry.type === 'down' ? 'var(--success)' : 'var(--muted)';
      const isInitial = (h === i.priceHistory.length - 1);
      historyHtml += '<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">';
      historyHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
      historyHtml += '<span style="font-family:JetBrains Mono,monospace;font-size:13px;font-weight:700;">';
      historyHtml += '<span style="color:' + arrowColor + ';">' + arrow + '</span> Buy: ₹' + (entry.buyPrice || 0) + ' | Sell: ₹' + (entry.sellPrice || 0);
      historyHtml += '</span>';
      if (isInitial) historyHtml += '<span style="font-size:10px;background:var(--accent-light);color:var(--accent);padding:2px 7px;border-radius:10px;font-weight:700;">Initial</span>';
      historyHtml += '</div>';
      if (entry.prevBuyPrice != null) historyHtml += '<div style="font-size:11px;color:var(--muted);">Was: ₹' + entry.prevBuyPrice + ' buy | ₹' + (entry.prevSellPrice || 0) + ' sell</div>';
      if (entry.reason) historyHtml += '<div style="font-size:11px;color:var(--text2);margin-top:2px;">Note: ' + window.escapeHtml(entry.reason) + '</div>';
      historyHtml += '<div style="font-size:10px;color:var(--muted);margin-top:3px;">' + entry.date + '</div>';
      historyHtml += '</div>';
    }
    historyHtml += '</div>';
  } else {
    historyHtml = '<div style="margin-top:12px;font-size:12px;color:var(--muted);">No price history yet.</div>';
  }
  let html = `<div class="modal-title">${window.escapeHtml(i.name)}</div>`;
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
  html += '<div style="background:var(--accent-light);border-radius:10px;padding:10px 12px;">';
  html += '<div style="font-size:10px;font-weight:700;color:var(--muted);">Buy Price</div>';
  html += `<div style="font-size:18px;font-weight:700;color:var(--accent);">₹${(i.buyPrice || 0).toLocaleString()}</div>`;
  html += '</div>';
  html += '<div style="background:var(--success-light);border-radius:10px;padding:10px 12px;">';
  html += '<div style="font-size:10px;font-weight:700;color:var(--muted);">Sell Price</div>';
  html += `<div style="font-size:18px;font-weight:700;color:var(--success);">₹${(i.sellPrice || 0).toLocaleString()}</div>`;
  html += '</div></div>';
  if (i.updated) html += `<p style="font-size:12px;color:var(--muted);margin:6px 0 12px;"><strong>Last Updated:</strong> ${i.updated}</p>`;
  if (i.brand) html += `<p style="color:var(--muted);margin-bottom:4px;font-size:13px;">Brand: ${window.escapeHtml(i.brand)}</p>`;
  if (i.cat) html += `<p style="color:var(--muted);margin-bottom:4px;font-size:13px;">Category: ${window.escapeHtml(i.cat)}</p>`;
  if (i.unit) html += `<p style="color:var(--muted);margin-bottom:4px;font-size:13px;">Unit: ${window.escapeHtml(i.unit)}</p>`;
  if (i.distributor) html += `<p style="color:var(--muted);margin-bottom:4px;font-size:13px;">Distributor: ${window.escapeHtml(i.distributor)}</p>`;
  if (i.location) html += `<p style="color:var(--muted);margin-bottom:4px;font-size:13px;">Location: ${window.escapeHtml(i.location)}</p>`;
  if (i.note) html += `<p style="color:var(--text2);margin-bottom:4px;font-size:13px;margin-top:4px;">${window.escapeHtml(i.note)}</p>`;
  html += historyHtml;
  html += '<button class="save-btn" style="margin-top:16px;" onclick="window.closeDetail()">Close</button>';
  document.getElementById('detailContent').innerHTML = html;
  document.getElementById('detailModal').classList.add('active');
};

window.closeDetail = function() {
  document.getElementById('detailModal').classList.remove('active');
};

window.saveSnapshot = function(data) {
  try { localStorage.setItem('erSnapshot', JSON.stringify(data)); localStorage.setItem('erSnapshotTime', Date.now().toString()); } catch (e) { }
};

window.loadSnapshot = function() {
  try {
    const raw = localStorage.getItem('erSnapshot');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
};

window.saveToDB = async function() {
  window._lastEditTime = Date.now();
  await window.saveItemsToDB(window.items);
  try { localStorage.setItem('electricRates_backup', JSON.stringify(window.items)); } catch (e) { }
  if (!window._gsPushPending) {
    window._gsPushPending = true;
    setTimeout(() => {
      window.gsPushToSheet(true);
      setTimeout(() => { window._gsPushPending = false; }, 1800);
    }, 400);
  }
};

window.initData = async function() {
  let loaded = await window.loadItemsFromDB();
  if (loaded && loaded.length > 0) {
    window.items = loaded;
    return;
  }
  const backup = localStorage.getItem('electricRates_backup');
  if (backup) {
    try { window.items = JSON.parse(backup); } catch (e) { }
  }
};
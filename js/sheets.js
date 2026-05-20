// ====================== GOOGLE SHEETS SYNC ======================
const GS_HARDCODED_URL = 'https://script.google.com/macros/s/AKfycbwVop8Nv2yon-J2UjWga98U_AZgTIZwTK-jJzf4-izFlDuwYuYLxEr42nGpy2wNhIKDSw/exec';

window._gsPushPending = false;
window._lastEditTime = 0;
window._pushInFlight = false;
window._pushCompletedAt = 0;
const PUSH_SETTLE_MS = 15000;

window.gsGetUrl = function() { return GS_HARDCODED_URL; };

window.gsPushToSheet = async function(silent = false) {
  if (window._pushInFlight) return;
  window._pushInFlight = true;
  try {
    const payload = { action: 'write', items: Array.isArray(window.items) ? window.items : [] };
    const response = await fetch(window.gsGetUrl(), {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    window._pushCompletedAt = Date.now();
    if (!silent) window.showToast('⬆️ Pushed to Sheet');
  } catch (err) {
    console.warn('Push failed:', err);
    if (!silent) window.showToast('Push failed – will retry later', '#c0392b');
  } finally {
    window._pushInFlight = false;
  }
};

window.gsQuietPull = async function() {
  if (window._pushInFlight) return;
  if (Date.now() - window._lastEditTime < 30000) return;
  if (Date.now() - window._pushCompletedAt < PUSH_SETTLE_MS) return;
  try {
    const resp = await fetch(window.gsGetUrl() + '?action=read');
    const text = await resp.text();
    const clean = text.trim().replace(/^[^\[{]*/, '').replace(/[^\]}]*$/, '');
    const data = JSON.parse(clean);
    if (!Array.isArray(data)) return;
    const remoteSig = JSON.stringify(data.map(i => `${i.id}:${i.buyPrice}:${i.sellPrice}`).sort());
    const localSig = JSON.stringify(window.items.map(i => `${i.id}:${i.buyPrice}:${i.sellPrice}`).sort());
    if (remoteSig !== localSig) {
      if (data.length >= window.items.length) {
        window.items = data.map(r => ({
          ...r, id: String(r.id),
          buyPrice: parseFloat(r.buyPrice) || 0,
          sellPrice: parseFloat(r.sellPrice) || 0,
          priceHistory: Array.isArray(r.priceHistory) ? r.priceHistory : []
        }));
        window.saveToDB?.();
        window.renderAll?.();
        window.showToast('🔄 Auto-updated from Sheet', '#1e88e5');
      } else {
        console.warn(`Sheet has ${data.length} items vs local ${window.items.length} — pushing local.`);
        window.gsPushToSheet(true);
      }
    }
  } catch(e) {}
};

window.gsStartupFetch = async function() {
  try {
    const resp = await fetch(window.gsGetUrl() + '?action=read');
    const text = await resp.text();
    const clean = text.trim().replace(/^[^\[{]*/, '').replace(/[^\]}]*$/, '');
    const data = JSON.parse(clean);
    if (Array.isArray(data) && data.length > 0) {
      window.items = data.map(row => ({ ...row, id: String(row.id), buyPrice: parseFloat(row.buyPrice) || 0, sellPrice: parseFloat(row.sellPrice) || 0, priceHistory: Array.isArray(row.priceHistory) ? row.priceHistory : [] }));
      window.saveToDB?.();
      window.renderAll?.();
      window.showToast(`📡 Loaded ${window.items.length} items from Sheet`);
    }
  } catch(e) {
    console.warn('GS fetch failed', e);
    const snap = window.loadSnapshot?.();
    if (snap && snap.length) { window.items = snap; window.renderAll?.(); }
  }
};

window.gsReconcile = function() {
  const btn = document.getElementById('syncBtn');
  if (btn) btn.style.opacity = '0.6';
  fetch(window.gsGetUrl() + '?action=read')
    .then(r => r.text())
    .then(t => {
      const clean = t.trim().replace(/^[^\[{]*/, '').replace(/[^\]}]*$/, '');
      const data = JSON.parse(clean);
      if (Array.isArray(data)) {
        window.items = data.map(r => ({ ...r, id: String(r.id), buyPrice: parseFloat(r.buyPrice) || 0, sellPrice: parseFloat(r.sellPrice) || 0, priceHistory: Array.isArray(r.priceHistory) ? r.priceHistory : [] }));
        window.saveToDB?.();
        window.renderAll?.();
        window.showToast(`🔄 Synced ${window.items.length} items`);
      }
    })
    .catch(() => window.showToast('Sync failed', '#c0392b'))
    .finally(() => { if (btn) btn.style.opacity = '1'; });
};

window.gsStartAutoPull = function() {
  setInterval(() => window.gsQuietPull?.(), 7000);
};
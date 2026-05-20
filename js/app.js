// ====================== INITIALIZATION ======================
window.items = [];
window.activeFilter = 'All';
window.activeSort = 'recent';
window._searchQuery = '';
window.editingId = null;
window._lastEditTime = 0;

window.onload = async () => {
  const savedTheme = localStorage.getItem('ratebook_theme') || 'aurora';
  window.setTheme(savedTheme);
  await window.initData();
  if (!window.items.length) window.items = [];
  await window.gsStartupFetch();
  window.gsStartAutoPull();
  window.renderAll();
  window.setupAutocomplete();
  window.setupExcelNavigation();
  window.setupAutoUppercase();
  if (window.openTabs.length === 0) window.createTab("Browse", "browse");
  const si = document.getElementById('searchInput');
  if (si) si.addEventListener('input', (e) => window.handleSearch(e.target.value));
  document.getElementById('filterChips')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-chip')) {
      window.activeFilter = e.target.dataset.cat;
      const currentTab = window.getCurrentTab?.();
      if (currentTab) currentTab.activeFilter = window.activeFilter;
      window.renderFilterChips();
      window.renderItems();
    }
  });
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('✅ Service Worker registered');
      if ('sync' in reg) reg.sync.register('sync-sheets').catch(() => {});
    } catch (err) { console.warn('Service Worker registration failed:', err); }
  }
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'background-sync') window.gsPushToSheet(true);
  });
  const addNameInputEsc = document.getElementById('addName');
  if (addNameInputEsc) {
    addNameInputEsc.addEventListener('keydown', function(e) { if (e.key === 'Escape') { window.clearAddForm(); setTimeout(() => addNameInputEsc.focus(), 10); } });
  }
  const nameInput = document.getElementById('addName');
  const nameClearBtn = document.getElementById('addNameClear');
  if (nameInput && nameClearBtn) {
    function toggleClearBtn() { nameClearBtn.classList.toggle('visible', nameInput.value.trim().length > 0); }
    nameInput.addEventListener('input', toggleClearBtn);
    nameInput.addEventListener('focus', toggleClearBtn);
    nameInput.addEventListener('blur', () => setTimeout(toggleClearBtn, 200));
  }
  document.querySelectorAll('input[type="number"]').forEach(input => {
    if (input.id.includes('BuyPrice') || input.id.includes('SellPrice') || input.id.includes('bulkValue')) {
      input.addEventListener('blur', function() { if (this.value) this.value = window.roundPrice(this.value); });
    }
  });
};
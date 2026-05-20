// ====================== UTILITIES ======================
window.showToast = function(msg, bg='#2a7a45'){ 
  let t = document.getElementById('toast'); 
  if (!t) return;
  t.innerText = msg; 
  t.style.background = bg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), 2500); 
};

window.escapeHtml = function(s) { 
  return String(s).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); 
};

window.roundPrice = function(n) {
  if (n == null || n === '' || isNaN(n)) return 0;
  return Math.round(parseFloat(n) * 100) / 100;
};

window.checkSellWarn = function(prefix) {
  let buy = parseFloat(document.getElementById(prefix + 'BuyPrice').value) || 0;
  let sell = parseFloat(document.getElementById(prefix + 'SellPrice').value) || 0;
  let warn = document.getElementById(prefix + 'SellWarn');
  if (warn) warn.classList.toggle('show', sell > 0 && sell < buy);
};

window.handleSearch = function(val) {
  if (window._searchTimeout) clearTimeout(window._searchTimeout);
  window._searchTimeout = setTimeout(() => {
    window._searchQuery = val.toLowerCase().trim();
    const currentTab = window.getCurrentTab?.();
    if (currentTab) currentTab.searchQuery = window._searchQuery;
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.classList.toggle('visible', window._searchQuery.length > 0);
    window.renderItems?.();
  }, 150);
};

window.toggleSidebar = function() {
  document.getElementById('sidebarNav')?.classList.toggle('open');
  document.getElementById('sidebarOverlay')?.classList.toggle('open');
};

window.closeSidebar = function() {
  document.getElementById('sidebarNav')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
};

window.toggleSidebarCollapse = function() {
  document.getElementById('sidebarNav')?.classList.toggle('collapsed');
};
// ====================== CHROME TABS ======================
window.openTabs = [];
window.activeTabId = null;

window.createTab = function(title = "Browse", type = "browse") {
  const tabId = 'tab-' + Date.now();
  window.openTabs.push({
    id: tabId,
    title: title,
    type: type,
    searchQuery: '',
    activeFilter: 'All',
    activeSort: 'recent'
  });
  window.renderChromeTabs();
  window.switchToTab(tabId);
  return tabId;
};

window.getCurrentTab = function() {
  return window.openTabs.find(t => t.id === window.activeTabId);
};

window.renderChromeTabs = function() {
  const bar = document.getElementById('chromeTabsBar');
  if (!bar) return;
  bar.innerHTML = window.openTabs.map(tab => `
    <div class="chrome-tab ${tab.id === window.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
      <span>${window.escapeHtml(tab.title)}</span>
      <span onclick="event.stopImmediatePropagation(); window.closeTab('${tab.id}');" style="margin-left:8px; opacity:0.6; font-size:18px; line-height:1; padding:0 4px;">×</span>
    </div>
  `).join('');
  bar.querySelectorAll('.chrome-tab').forEach(el => {
    el.replaceWith(el.cloneNode(true));
  });
  bar.querySelectorAll('.chrome-tab').forEach(el => {
    el.addEventListener('click', (e) => {
      if (!e.target.closest('span[onclick]')) {
        window.switchToTab(el.dataset.tabId);
      }
    });
  });
};

window.switchToTab = function(tabId) {
  window.activeTabId = tabId;
  window.renderChromeTabs();
  const tab = window.getCurrentTab();
  if (tab) {
    window._searchQuery = tab.searchQuery || '';
    window.activeFilter = tab.activeFilter || 'All';
    window.activeSort = tab.activeSort || 'recent';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = window._searchQuery;
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.classList.toggle('visible', window._searchQuery.length > 0);
    window.openPane(tab.type);
    window.renderAll();
  }
};

window.closeTab = function(tabId) {
  if (window.openTabs.length === 1) return;
  const index = window.openTabs.findIndex(t => t.id === tabId);
  if (index === -1) return;
  window.openTabs.splice(index, 1);
  if (window.activeTabId === tabId) {
    window.activeTabId = window.openTabs[Math.max(0, index - 1)].id;
  }
  window.renderChromeTabs();
  window.switchToTab(window.activeTabId);
};

window.addNewTab = function() {
  window.createTab("Browse", "browse");
};

window.openPane = function(id) {
  const currentTab = window.getCurrentTab();
  if (currentTab && currentTab.type === id) {
    window.switchPanelOnly(id);
  } else {
    const title = id === 'browse' ? 'Browse' : id === 'add' ? 'Add Item' : id === 'quote' ? 'Quotation' : 'Settings';
    window.createTab(title, id);
  }
  if (window.innerWidth < 768) window.closeSidebar();
};

window.switchPanelOnly = function(id) {
  document.querySelectorAll('.panel-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById('pane-' + id);
  const panel = document.getElementById('tab-' + id);
  if (pane) pane.classList.add('active');
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  const sidebarItem = document.querySelector(`.sidebar-item[onclick*="'${id}'"]`);
  if (sidebarItem) sidebarItem.classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.querySelector(`.tab[onclick*="'${id}'"]`);
  if (tabEl) tabEl.classList.add('active');
  window.renderChromeTabs();
};

window.switchTab = function(id) {
  window.openPane(id);
};
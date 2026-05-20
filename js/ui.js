// ====================== RENDERING & UI ======================
window.renderAll = function() {
  window.renderStats();
  window.renderFilterChips();
  window.renderItems();
  document.getElementById('itemCount').innerText = window.items.length + ' Items';
};

window.renderStats = function() {
  const total = window.items.length;
  const avgBuy = total ? window.items.reduce((s, i) => s + (i.buyPrice || 0), 0) / total : 0;
  const statsBar = document.getElementById('statsBar');
  if (statsBar) {
    statsBar.innerHTML =
      `<div class="stat-card">${total}<span>Items</span></div>` +
      `<div class="stat-card">${new Set(window.items.map(i => i.cat || 'Misc')).size}<span>Categories</span></div>` +
      `<div class="stat-card">₹${avgBuy.toFixed(0)}<span>Avg Buy</span></div>`;
  }
};

window.renderFilterChips = function() {
  const cats = ['All', ...new Set(window.items.map(i => i.cat || 'Misc'))];
  const container = document.getElementById('filterChips');
  if (container) {
    container.innerHTML = cats.map(c =>
      `<button class="filter-chip ${c === window.activeFilter ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
  }
};

window.renderItems = function() {
  let list = window.items.filter(i => i.name);
  if (window.activeFilter !== 'All') {
    list = list.filter(i => (i.cat || 'Misc') === window.activeFilter);
  }
  const q = window._searchQuery;
  if (q) {
    list = list.filter(i => {
      const searchText = [i.name, i.brand, i.cat, i.distributor, i.location, i.note, i.updated].join(' ').toLowerCase();
      return searchText.includes(q);
    });
  }
  if (window.activeSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (window.activeSort === 'buy-asc') list.sort((a, b) => (a.buyPrice || 0) - (b.buyPrice || 0));
  else list.sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')));
  list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const container = document.getElementById('itemsList');
  if (!list.length) {
    container.innerHTML = '<div class="empty">📭 No items found</div>';
    return;
  }
  container.innerHTML = list.map(i => {
    const isSelected = window.selectedItems && window.selectedItems.includes(i.id);
    const selectionMode = window.isSelectionMode;
    return `
      <div class="item-card ${i.pinned ? 'pinned' : ''} ${selectionMode ? 'selectable' : ''}" 
           onclick="${selectionMode ? `window.toggleFullCardSelection?.('${i.id}', event)` : ''}">
        <div class="item-card-header">
          <div class="item-checkbox-wrapper" style="display: ${selectionMode ? 'block' : 'none'};">
            <input type="checkbox" class="item-checkbox" data-id="${i.id}" ${isSelected ? 'checked' : ''}
                   onchange="window.toggleItemSelection?.('${i.id}', this.checked); event.stopImmediatePropagation();">
          </div>
          <div class="item-card-content">
            <div class="item-title-row">
              <span class="item-name">${window.escapeHtml(i.name)}</span>
              ${i.brand ? `<span class="item-brand">${window.escapeHtml(i.brand)}</span>` : ''}
            </div>
            <div class="item-price-row">
              <span class="price-buy">₹${(i.buyPrice || 0).toLocaleString()}</span>
              <span class="price-sep">→</span>
              <span class="price-sell">₹${(i.sellPrice || 0).toLocaleString()}</span>
            </div>
            <div class="item-meta-row">
              ${i.cat ? `<span class="item-cat">📁 ${window.escapeHtml(i.cat)}</span>` : ''}
              ${i.updated ? `<span class="item-updated">🕒 ${i.updated}</span>` : ''}
            </div>
          </div>
          <div class="item-pin" onclick="event.stopPropagation(); window.togglePin?.('${i.id}');">${i.pinned ? '⭐' : '☆'}</div>
          <div class="item-view" onclick="event.stopPropagation(); window.openDetail?.('${i.id}');">👁️</div>
        </div>
        <div class="item-actions" onclick="event.stopPropagation()" ontouchstart="event.stopPropagation()">
          <button class="act-btn btn-edit" onclick="event.stopPropagation();window.openEdit?.('${i.id}')">✏️ Edit</button>
          <button class="act-btn btn-delete" onclick="event.stopPropagation();window.deleteItem?.('${i.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
};

window.setSort = function(s) {
  window.activeSort = s;
  const currentTab = window.getCurrentTab?.();
  if (currentTab) currentTab.activeSort = s;
  document.querySelectorAll('.sort-pill').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('sort-' + s);
  if (el) el.classList.add('active');
  window.renderItems();
};

window.fillFromItem = function(id) {
  const existing = window.items.find(i => i.id === id);
  if (!existing) return;
  document.getElementById('addName').value = (existing.name || '').toUpperCase();
  document.getElementById('addBrand').value = (existing.brand || '').toUpperCase();
  document.getElementById('addBuyPrice').value = existing.buyPrice || '';
  document.getElementById('addSellPrice').value = existing.sellPrice || '';
  document.getElementById('addUnit').value = (existing.unit || '').toUpperCase();
  document.getElementById('addCat').value = (existing.cat || '').toUpperCase();
  document.getElementById('addDistributor').value = (existing.distributor || '').toUpperCase();
  document.getElementById('addLocation').value = (existing.location || '').toUpperCase();
  document.getElementById('addNote').value = existing.note || '';
  const dropdown = document.getElementById('nameDropdown');
  if (dropdown) dropdown.style.display = 'none';
  document.getElementById('addName').focus();
};

window.setupAutocomplete = function() {
  const fields = { addBrand: 'brand', addCat: 'cat', addDistributor: 'distributor', addUnit: 'unit', addLocation: 'location' };
  Object.keys(fields).forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    let dl = document.createElement('datalist');
    dl.id = fieldId + 'List';
    document.body.appendChild(dl);
    input.setAttribute('list', dl.id);
    input.addEventListener('focus', () => {
      const values = [...new Set(window.items.map(i => i[fields[fieldId]]).filter(Boolean))].sort();
      dl.innerHTML = values.map(v => `<option value="${window.escapeHtml(v)}">`).join('');
    });
  });
  // Name autocomplete with dropdown
  const nameInput = document.getElementById('addName');
  if (!nameInput) return;
  const dropdown = document.createElement('div');
  dropdown.id = 'nameDropdown';
  dropdown.style.cssText = `position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-surface); border: 1.5px solid var(--accent); border-radius: 10px; z-index: 999; max-height: 200px; overflow-y: auto; display: none; box-shadow: var(--shadow-md);`;
  nameInput.parentElement.style.position = 'relative';
  nameInput.parentElement.appendChild(dropdown);
  let highlightedIndex = -1;
  function highlightItem(index) {
    const items = dropdown.querySelectorAll('.suggestion-item');
    items.forEach((item, i) => {
      item.style.background = (i === index) ? 'var(--accent-light)' : '';
      item.style.color = (i === index) ? 'var(--accent)' : '';
    });
    highlightedIndex = index;
  }
  nameInput.addEventListener('input', () => {
    const val = nameInput.value.trim().toLowerCase();
    highlightedIndex = -1;
    if (!val) { dropdown.style.display = 'none'; return; }
    const matches = window.items.filter(i => i.name && i.name.toLowerCase().includes(val)).slice(0, 8);
    if (!matches.length) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = matches.map((item, idx) => `
      <div class="suggestion-item" data-index="${idx}" style="padding:12px 14px; cursor:pointer; font-size:14px; border-bottom:1px solid var(--border);"
           onclick="window.fillFromItem('${item.id}'); document.getElementById('nameDropdown').style.display='none';">
        ${window.escapeHtml(item.name)} <span style="font-size:11px; color:var(--muted); margin-left:6px;">₹${item.buyPrice} · ${item.cat || ''}</span>
      </div>
    `).join('');
    dropdown.style.display = 'block';
  });
  nameInput.addEventListener('keydown', function(e) {
    if (dropdown.style.display !== 'block') return;
    const items = dropdown.querySelectorAll('.suggestion-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % items.length;
      highlightItem(highlightedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
      highlightItem(highlightedIndex);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = items[highlightedIndex];
      if (selected) {
        const match = selected.getAttribute('onclick').match(/fillFromItem\('(.*?)'\)/);
        if (match) window.fillFromItem(match[1]);
        dropdown.style.display = 'none';
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      highlightedIndex = -1;
    }
  });
  nameInput.addEventListener('blur', () => {
    setTimeout(() => { dropdown.style.display = 'none'; highlightedIndex = -1; }, 200);
  });
};

window.setupAutoUppercase = function() {
  const upperFields = ['addName', 'addBrand', 'addUnit', 'addCat', 'addDistributor', 'addLocation', 'editName', 'editBrand', 'editUnit', 'editCat', 'editDistributor', 'editLocation'];
  upperFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.style.textTransform = 'uppercase';
    if (input._uppercaseHandler) input.removeEventListener('input', input._uppercaseHandler);
    input._uppercaseHandler = function() { this.value = this.value.toUpperCase(); };
    input.addEventListener('input', input._uppercaseHandler);
  });
};

window.setupExcelNavigation = function() {
  const fieldOrder = ['addName', 'addBrand', 'addBuyPrice', 'addSellPrice', 'addUnit', 'addCat', 'addDistributor', 'addLocation', 'addNote'];
  fieldOrder.forEach((fieldId, index) => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.addEventListener('keydown', function(e) {
      if (fieldId === 'addName') {
        const dropdown = document.getElementById('nameDropdown');
        if (dropdown && dropdown.style.display === 'block' && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) return;
      }
      if (el.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) e.preventDefault();
      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        let nextIndex = index;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextIndex = (index + 1) % fieldOrder.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') nextIndex = (index - 1 + fieldOrder.length) % fieldOrder.length;
        const nextField = document.getElementById(fieldOrder[nextIndex]);
        if (nextField) { e.preventDefault(); nextField.focus(); if (nextField.type !== 'textarea') nextField.select(); }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (fieldId === 'addNote') window.saveItem();
        else {
          const nextIndex = (index + 1) % fieldOrder.length;
          const nextField = document.getElementById(fieldOrder[nextIndex]);
          if (nextField) nextField.focus();
        }
      }
    });
  });
};
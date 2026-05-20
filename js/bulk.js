// ====================== BULK UPDATE ======================
window.selectedItems = [];
window.isSelectionMode = false;
window.bulkTextValues = {};

window.toggleItemSelection = function(id, isChecked) {
  if (isChecked) {
    if (!window.selectedItems.includes(id)) window.selectedItems.push(id);
  } else {
    window.selectedItems = window.selectedItems.filter(itemId => itemId !== id);
  }
};

window.toggleSelectionMode = function() {
  window.isSelectionMode = !window.isSelectionMode;
  const btn = document.getElementById('selectModeBtn');
  if (btn) {
    btn.textContent = window.isSelectionMode ? '✕ Cancel' : '✅ Select';
    btn.style.background = window.isSelectionMode ? 'var(--danger-light)' : 'var(--accent-light)';
    btn.style.color = window.isSelectionMode ? 'var(--danger)' : 'var(--accent)';
  }
  if (!window.isSelectionMode) window.selectedItems = [];
  window.renderItems();
};

window.toggleFullCardSelection = function(id, e) {
  if (!window.isSelectionMode) return;
  e.stopImmediatePropagation();
  const checkbox = document.querySelector(`input[data-id="${id}"]`);
  const currentlySelected = window.selectedItems.includes(id);
  window.toggleItemSelection(id, !currentlySelected);
  if (checkbox) checkbox.checked = !currentlySelected;
  window.renderItems();
};

window.openBulkUpdate = function() {
  if (window.selectedItems.length === 0 && window._searchQuery === '' && !window.isSelectionMode) {
    window.showToast('Please use "Select" mode or have an active search', '#f59e0b');
    return;
  }
  window.bulkTextValues = {};
  document.getElementById('bulkModal').classList.add('active');
  document.getElementById('bulkScope').onchange = window.updateBulkUI;
  document.getElementById('bulkValue').value = '';
  document.getElementById('bulkOperation').value = 'set';
  window.setupBulkFieldListeners();
  window.toggleBulkSections();
  window.updateBulkUI();
};

window.setupBulkFieldListeners = function() {
  const priceFields = ['updateBuy', 'updateSell'];
  const textFields = ['updateCat', 'updateBrand', 'updateDist', 'updateUnit', 'updateLoc', 'updateNote'];
  [...priceFields, ...textFields].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onchange = window.toggleBulkSections;
  });
};

window.toggleBulkSections = function() {
  const hasPrice = document.getElementById('updateBuy').checked || document.getElementById('updateSell').checked;
  const hasText = ['updateCat', 'updateBrand', 'updateDist', 'updateUnit', 'updateLoc', 'updateNote'].some(id => document.getElementById(id).checked);
  const priceDiv = document.getElementById('bulkPriceSection');
  const textDiv = document.getElementById('bulkTextSection');
  priceDiv.style.display = hasPrice ? 'block' : 'none';
  textDiv.style.display = hasText ? 'block' : 'none';
  if (hasPrice && hasText) {
    priceDiv.style.flex = '1';
    textDiv.style.flex = '1';
  } else if (hasPrice) {
    priceDiv.style.flex = 'auto';
    priceDiv.style.width = '100%';
  } else if (hasText) {
    textDiv.style.flex = 'auto';
    textDiv.style.width = '100%';
  }
  if (hasText) window.renderTextFieldRows();
};

window.getFieldSuggestions = function(fieldKey) {
  const values = window.items.map(i => i[fieldKey]).filter(v => v && typeof v === 'string');
  return [...new Set(values)].sort();
};

window.renderTextFieldRows = function() {
  const container = document.getElementById('bulkTextInputsContainer');
  if (!container) return;
  container.innerHTML = '';
  const fieldMap = {
    updateCat: { label: 'Category', field: 'cat' },
    updateBrand: { label: 'Brand', field: 'brand' },
    updateDist: { label: 'Distributor', field: 'distributor' },
    updateUnit: { label: 'Unit', field: 'unit' },
    updateLoc: { label: 'Location', field: 'location' },
    updateNote: { label: 'Note', field: 'note' }
  };
  for (const [chkId, info] of Object.entries(fieldMap)) {
    const chk = document.getElementById(chkId);
    if (chk && chk.checked) {
      const fieldKey = info.field;
      const suggestions = window.getFieldSuggestions(fieldKey);
      const row = document.createElement('div');
      row.className = 'bulk-field-row';
      row.dataset.field = fieldKey;
      const labelSpan = document.createElement('label');
      labelSpan.textContent = info.label;
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `New ${info.label} (or type new)`;
      input.value = window.bulkTextValues[fieldKey] || '';
      input.setAttribute('list', `suggest-${fieldKey}`);
      const datalist = document.createElement('datalist');
      datalist.id = `suggest-${fieldKey}`;
      suggestions.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        datalist.appendChild(opt);
      });
      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add';
      addBtn.type = 'button';
      addBtn.onclick = () => {
        const newVal = input.value.trim();
        if (newVal) {
          window.bulkTextValues[fieldKey] = newVal;
          window.showToast(`✓ "${newVal}" will be used for ${info.label}`, '#1e88e5');
          const dl = document.getElementById(`suggest-${fieldKey}`);
          if (dl && ![...dl.options].some(opt => opt.value === newVal)) {
            const opt = document.createElement('option');
            opt.value = newVal;
            dl.appendChild(opt);
          }
        } else {
          window.showToast('Please enter a value first', '#f59e0b');
        }
      };
      input.addEventListener('input', (e) => { window.bulkTextValues[fieldKey] = e.target.value; });
      row.appendChild(labelSpan);
      row.appendChild(input);
      row.appendChild(datalist);
      row.appendChild(addBtn);
      container.appendChild(row);
    }
  }
};

window.updateBulkUI = function() {
  const scope = document.getElementById('bulkScope').value;
  const extra = document.getElementById('bulkScopeExtra');
  let html = '';
  if (scope === 'category') {
    const cats = [...new Set(window.items.map(i => i.cat).filter(Boolean))].sort();
    html = `<label>Category</label><select id="bulkCatValue" style="width:100%;margin-top:8px;padding:10px;">`;
    cats.forEach(c => html += `<option value="${c}">${c}</option>`);
    html += `</select>`;
  } else if (scope === 'distributor') {
    const dists = [...new Set(window.items.map(i => i.distributor).filter(Boolean))].sort();
    html = `<label>Supplier/Distributor</label><select id="bulkDistValue" style="width:100%;margin-top:8px;padding:10px;">`;
    dists.forEach(d => html += `<option value="${d}">${d}</option>`);
    html += `</select>`;
  }
  extra.innerHTML = html;
  if (extra.querySelector('select')) extra.querySelector('select').onchange = window.updateBulkPreview;
  window.updateBulkPreview();
};

window.updateBulkPreview = function() {
  let count = 0;
  const scope = document.getElementById('bulkScope').value;
  if (scope === 'selected') count = window.selectedItems.length;
  else if (scope === 'search') {
    const q = window._searchQuery.toLowerCase();
    count = window.items.filter(i => [i.name, i.brand, i.cat, i.distributor, i.note].join(' ').toLowerCase().includes(q)).length;
  } else if (scope === 'all') count = window.items.length;
  else if (scope === 'category') {
    const cat = document.getElementById('bulkCatValue')?.value;
    if (cat) count = window.items.filter(i => i.cat === cat).length;
  } else if (scope === 'distributor') {
    const dist = document.getElementById('bulkDistValue')?.value;
    if (dist) count = window.items.filter(i => i.distributor === dist).length;
  }
  document.getElementById('bulkCount').innerText = count;
  document.getElementById('bulkPreview').innerHTML = `<strong>Will update <span style="color:var(--accent)">${count}</span> items</strong><br><small>Multiple fields can be updated at once.</small>`;
};

window.calculateNewPrice = function(current, operation, value) {
  if (!current) current = 0;
  let result = current;
  switch (operation) {
    case 'set': result = value; break;
    case 'increase': result = current + value; break;
    case 'decrease': result = current - value; break;
    case 'percent_up': result = current * (1 + value / 100); break;
    case 'percent_down': result = current * (1 - value / 100); break;
  }
  return window.roundPrice(result);
};

window.applyBulkUpdate = function() {
  const scope = document.getElementById('bulkScope').value;
  let targets = [];
  if (scope === 'selected') targets = window.items.filter(i => window.selectedItems.includes(i.id));
  else if (scope === 'search') {
    const q = window._searchQuery.toLowerCase();
    targets = window.items.filter(i => [i.name, i.brand, i.cat, i.distributor, i.note].join(' ').toLowerCase().includes(q));
  } else if (scope === 'category') {
    const cat = document.getElementById('bulkCatValue')?.value;
    targets = window.items.filter(i => i.cat === cat);
  } else if (scope === 'distributor') {
    const dist = document.getElementById('bulkDistValue')?.value;
    targets = window.items.filter(i => i.distributor === dist);
  } else if (scope === 'all') targets = [...window.items];
  if (targets.length === 0) { window.showToast('No items matched', '#c0392b'); return; }
  let count = 0;
  targets.forEach(item => {
    if (document.getElementById('updateBuy').checked) {
      const op = document.getElementById('bulkOperation').value;
      const val = parseFloat(document.getElementById('bulkValue').value) || 0;
      item.buyPrice = window.calculateNewPrice(item.buyPrice, op, val);
    }
    if (document.getElementById('updateSell').checked) {
      const op = document.getElementById('bulkOperation').value;
      const val = parseFloat(document.getElementById('bulkValue').value) || 0;
      item.sellPrice = window.calculateNewPrice(item.sellPrice || item.buyPrice, op, val);
    }
    if (document.getElementById('updateCat').checked && window.bulkTextValues['cat']) item.cat = window.bulkTextValues['cat'];
    if (document.getElementById('updateBrand').checked && window.bulkTextValues['brand']) item.brand = window.bulkTextValues['brand'];
    if (document.getElementById('updateDist').checked && window.bulkTextValues['distributor']) item.distributor = window.bulkTextValues['distributor'];
    if (document.getElementById('updateUnit').checked && window.bulkTextValues['unit']) item.unit = window.bulkTextValues['unit'];
    if (document.getElementById('updateLoc').checked && window.bulkTextValues['location']) item.location = window.bulkTextValues['location'];
    if (document.getElementById('updateNote').checked && window.bulkTextValues['note']) item.note = window.bulkTextValues['note'];
    item.updated = new Date().toLocaleDateString('en-IN');
    count++;
  });
  window.saveToDB();
  window.renderAll();
  window.selectedItems = [];
  window.isSelectionMode = false;
  const btn = document.getElementById('selectModeBtn');
  if (btn) { btn.textContent = '✅ Select'; btn.style.background = 'var(--accent-light)'; btn.style.color = 'var(--accent)'; }
  window.closeBulkModal();
  window.renderItems();
  window.showToast(`✅ Updated ${count} items`, '#10b981');
};

window.closeBulkModal = function() {
  document.getElementById('bulkModal').classList.remove('active');
  window.bulkTextValues = {};
};
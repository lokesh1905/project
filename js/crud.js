// ====================== CRUD OPERATIONS ======================
window.saveItem = function() {
  let name = document.getElementById('addName').value.trim().toUpperCase();
  if (!name) {
    window.showToast('Item name is required', '#c0392b');
    return;
  }
  let buyPrice = window.roundPrice(document.getElementById('addBuyPrice').value);
  let sellPrice = window.roundPrice(document.getElementById('addSellPrice').value);
  if (isNaN(buyPrice)) {
    window.showToast('Valid buy price is required', '#c0392b');
    return;
  }
  let newItem = {
    id: Date.now().toString(),
    name: name,
    brand: document.getElementById('addBrand').value.trim().toUpperCase(),
    buyPrice: buyPrice,
    sellPrice: sellPrice,
    unit: document.getElementById('addUnit').value.trim().toUpperCase(),
    cat: document.getElementById('addCat').value.trim().toUpperCase(),
    distributor: document.getElementById('addDistributor').value.trim().toUpperCase(),
    location: document.getElementById('addLocation').value.trim().toUpperCase(),
    note: document.getElementById('addNote').value.trim(),
    updated: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    priceHistory: [],
    pinned: false
  };
  newItem.priceHistory = [{
    date: new Date().toLocaleString(),
    buyPrice: buyPrice,
    sellPrice: sellPrice,
    type: 'new'
  }];
  window.items.unshift(newItem);
  window.saveToDB();
  window.renderAll();
  window.clearAddForm();
  window.showToast(`✅ "${name}" added`);
};

window.updateItem = function() {
  let idx = window.items.findIndex(i => i.id === window.editingId);
  if (idx === -1) return;
  let old = window.items[idx];
  let newName = document.getElementById('editName').value.trim().toUpperCase();
  let newBrand = document.getElementById('editBrand').value.trim().toUpperCase();
  let newUnit = document.getElementById('editUnit').value.trim().toUpperCase();
  let newCat = document.getElementById('editCat').value.trim().toUpperCase();
  let newDistributor = document.getElementById('editDistributor').value.trim().toUpperCase();
  let newLocation = document.getElementById('editLocation').value.trim().toUpperCase();
  let newNote = document.getElementById('editNote').value.trim();
  let newBuy = window.roundPrice(document.getElementById('editBuyPrice').value);
  let newSell = window.roundPrice(document.getElementById('editSellPrice').value);
  if (!newName || isNaN(newBuy)) {
    window.showToast('Name and buy price required', '#c0392b');
    return;
  }
  let history = Array.isArray(old.priceHistory) ? [...old.priceHistory] : [];
  let reason = document.getElementById('editReason').value.trim();
  if (newBuy !== old.buyPrice || newSell !== (old.sellPrice || 0)) {
    history.unshift({
      date: new Date().toLocaleString(),
      buyPrice: newBuy,
      sellPrice: newSell,
      prevBuyPrice: old.buyPrice,
      prevSellPrice: old.sellPrice,
      type: newBuy > old.buyPrice ? 'up' : 'down',
      reason: reason || 'Manual edit'
    });
  }
  window.items[idx] = {
    ...old,
    name: newName,
    brand: newBrand,
    buyPrice: newBuy,
    sellPrice: newSell,
    unit: newUnit,
    cat: newCat,
    distributor: newDistributor,
    location: newLocation,
    note: newNote,
    updated: new Date().toLocaleDateString('en-IN'),
    priceHistory: history
  };
  window.saveToDB();
  window.renderAll();
  window.closeEdit();
  window.showToast('Item updated ✓');
};

window.deleteItem = function(id) {
  if (!confirm('Delete permanently?')) return;
  window.items = window.items.filter(i => i.id !== id);
  window.saveToDB();
  window.renderAll();
  window.showToast('🗑️ Deleted');
};

window.togglePin = function(id) {
  const item = window.items.find(i => i.id === id);
  if (!item) return;
  item.pinned = !item.pinned;
  window.saveToDB();
  window.renderItems();
  const msg = item.pinned ? '📌 Item Pinned' : '📌 Pin Removed';
  window.showToast(msg, item.pinned ? '#eab308' : '#64748b');
};

window.clearNameField = function() {
  const nameInput = document.getElementById('addName');
  if (nameInput) {
    nameInput.value = '';
    nameInput.focus();
  }
  const clearBtn = document.getElementById('addNameClear');
  if (clearBtn) clearBtn.classList.remove('visible');
};

window.clearAddForm = function() {
  const fields = ['addName', 'addBrand', 'addBuyPrice', 'addSellPrice', 'addUnit', 'addCat', 'addDistributor', 'addLocation', 'addNote'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const warn = document.getElementById('addSellWarn');
  if (warn) warn.classList.remove('show');
  window.showToast('Form cleared', '#64748b');
};
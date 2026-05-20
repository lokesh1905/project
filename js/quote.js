// ====================== QUOTATION ======================
window.quoteSelections = {};

window.renderQuoteItems = function() {
  let q = document.getElementById('quoteSearch')?.value.toLowerCase();
  let list = window.items.filter(i => !q || i.name.toLowerCase().includes(q));
  const container = document.getElementById('quoteItemsList');
  if (container) {
    container.innerHTML = list.map(i => `
      <div style="padding:10px;border-radius:8px;cursor:pointer;background:${window.quoteSelections[i.id] ? 'var(--accent-light)' : 'transparent'};margin-bottom:4px;" onclick="window.toggleQuoteItem('${i.id}')">
        ${window.escapeHtml(i.name)} — ₹${(i.sellPrice || i.buyPrice || 0).toLocaleString()}
      </div>
    `).join('');
  }
  window.renderQuoteSummary();
};

window.toggleQuoteItem = function(id) {
  if (window.quoteSelections[id]) delete window.quoteSelections[id];
  else window.quoteSelections[id] = 1;
  window.renderQuoteItems();
  window.renderQuoteSummary();
};

window.renderQuoteSummary = function() {
  let total = 0;
  Object.keys(window.quoteSelections).forEach(id => {
    let it = window.items.find(i => i.id === id);
    if (it) total += (it.sellPrice || it.buyPrice || 0);
  });
  const summary = document.getElementById('quoteSummary');
  if (summary) summary.innerHTML = `Total: <strong style="font-family:'JetBrains Mono',monospace;">₹${total.toLocaleString()}</strong>`;
};

window.shareQuote = function() {
  let msg = 'Quote:\n';
  Object.keys(window.quoteSelections).forEach(id => {
    let it = window.items.find(i => i.id === id);
    if (it) msg += `${it.name} - ₹${(it.sellPrice || it.buyPrice || 0)}\n`;
  });
  alert(msg);
};
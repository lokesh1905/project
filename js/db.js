// ==================== INDEXEDDB STORAGE ====================
const DB_NAME = 'ElectricShopDB';
const STORE_NAME = 'items';
let dbInstance = null;

window.openDB = function() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

window.loadItemsFromDB = async function() {
  try {
    const db = await window.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    console.warn("IndexedDB load failed");
    return [];
  }
};

window.saveItemsToDB = async function(itemsArray) {
  try {
    const db = await window.openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    itemsArray.forEach(item => store.put(item));
    await tx.complete;
    return true;
  } catch (e) {
    console.warn("IndexedDB save failed, using backup");
    localStorage.setItem('electricRates_backup', JSON.stringify(itemsArray));
    return false;
  }
};
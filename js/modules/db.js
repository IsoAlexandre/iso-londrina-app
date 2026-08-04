/**
 * Minimal IndexedDB keyval wrapper. Two stores: "config" (price/text data layer)
 * and "session" (in-progress cliente/cart/examList). Falls back to an in-memory
 * Map if IndexedDB is unavailable (e.g. restrictive private-browsing contexts)
 * instead of throwing, so the app degrades to today's prototype behavior rather
 * than crashing.
 */
const DB_NAME = 'iso_londrina_db';
const DB_VERSION = 1;
const STORES = ['config', 'session'];

let dbPromise = null;
let memoryFallback = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(err => {
    console.warn('[db] IndexedDB indisponível, usando memória apenas:', err);
    memoryFallback = new Map();
    return null;
  });
  return dbPromise;
}

export async function dbGet(store, key) {
  const db = await openDB();
  if (!db) return memoryFallback.get(store + ':' + key);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(store, key, value) {
  const db = await openDB();
  if (!db) { memoryFallback.set(store + ':' + key, value); return; }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbDelete(store, key) {
  const db = await openDB();
  if (!db) { memoryFallback.delete(store + ':' + key); return; }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

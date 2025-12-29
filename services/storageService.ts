import { KEYS } from '../constants';

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

// helper for posix join in TS renderer
const pathJoin = (...parts: string[]) => parts.join('/');

// Replace original FS init with IPC-aware logic
let fsApi: any = null;
let dbPath: string | undefined;
let dataDir: string | undefined;

if (isElectron) {
  fsApi = (window as any).electronAPI;
  fsApi.getDataPath().then((p: string) => {
    dataDir = p;
    dbPath = pathJoin(p, 'database.json');
    console.log('Electron data path:', dbPath);
  }).catch((e: any) => console.error('getDataPath error', e));
}

type StorageData = Record<string, any>;

let memoryCache: StorageData = {};

export const StorageService = {
  async initialize() {
    this._loadFromFile();
  },

  set(key: string, value: any) {
    memoryCache[key] = value;
    this._saveToFile();
  },

  get(key: string) {
    return memoryCache[key];
  },

  remove(key: string) {
    delete memoryCache[key];
    this._saveToFile();
  },

  clear() {
    memoryCache = {};
    this._saveToFile();
  },

  getAll() {
    return { ...memoryCache };
  },

  _loadFromFile: () => {
    if (fsApi && dbPath) {
      fsApi.exists(dbPath).then((exists: boolean) => {
        if (!exists) return null;
        return fsApi.readFile(dbPath);
      }).then((data: string | null) => {
        if (data) {
          try { 
            memoryCache = JSON.parse(data);
            console.log('Loaded from Electron FS');
          } catch (e) { 
            console.error('Failed parse DB', e);
            memoryCache = {};
          }
        }
      }).catch(e => console.error('FS load error', e));
      return;
    }

    // Fallback: load keys from localStorage
    try {
      Object.keys(KEYS).forEach(k => {
        const keyName = (KEYS as any)[k];
        const value = localStorage.getItem(keyName);
        if (value) {
          try {
            memoryCache[keyName] = JSON.parse(value);
          } catch {
            memoryCache[keyName] = value;
          }
        }
      });
      console.log('Loaded from localStorage fallback');
    } catch (e) { 
      console.error('localStorage load error', e);
    }
  },

  _saveToFile: () => {
    if (fsApi && dbPath) {
      try {
        const payload = JSON.stringify(memoryCache, null, 2);
        fsApi.writeFile(dbPath, payload).catch((e: any) => console.error('FS write error', e));
        console.log('Saved to Electron FS');
      } catch (e) { 
        console.error('Failed to prepare write payload', e);
      }
      return;
    }

    // Fallback: write to localStorage
    try {
      Object.keys(memoryCache).forEach(k => {
        try { 
          localStorage.setItem(k, JSON.stringify(memoryCache[k]));
        } catch (e) {
          console.error(`Failed to save key ${k} to localStorage`, e);
        }
      });
      console.log('Saved to localStorage fallback');
    } catch (e) { 
      console.error('localStorage save error', e);
    }
  },
};

// Initialize on module load
StorageService.initialize();

export default StorageService;

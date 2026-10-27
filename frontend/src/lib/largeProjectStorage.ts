import type { SavedProject } from "./projectBackup";
import { parseSavedProject } from "./projectBackup";
import { listLocalProjects, readLocalProject, deleteLocalProject, type ProjectRecord } from "./localProjects";

const DB_NAME = "ai-rebuilder-projects";
const DB_VERSION = 1;
const STORE = "projects";

interface StoredProject extends ProjectRecord {
  json: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB is unavailable. Download a JSON backup.")); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open project storage."));
    request.onblocked = () => reject(new Error("Project database is locked by another tab. Close other app tabs and retry."));
  });
}

function transact<T>(db: IDBDatabase, mode: IDBTransactionMode, perform: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = perform(tx.objectStore(STORE));
    let value: T;
    req.onsuccess = () => { value = req.result; };
    req.onerror = () => reject(req.error ?? new Error("Project storage request failed."));
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error ?? new Error("Project storage failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Project storage was cancelled."));
  });
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const legacy = listLocalProjects();
  let db: IDBDatabase;
  try { db = await openDb(); }
  catch { return legacy; }
  try {
    const saved = await transact<StoredProject[]>(db, "readonly", (store) => store.getAll());
    const byId = new Map(legacy.map((item) => [item.id, item]));
    for (const item of saved) {
      const { id, name, updatedAt, size } = item;
      byId.set(id, { id, name, updatedAt, size });
    }
    return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally { db.close(); }
}

export async function saveProjectLarge(project: SavedProject, name: string, existingId?: string): Promise<ProjectRecord> {
  const cleanName = name.trim().slice(0, 80);
  if (!cleanName) throw new Error("Enter a project name.");
  const json = JSON.stringify(project);
  // Keep in sync with the JSON backup import safety limit.
  if (json.length > 30_000_000) throw new Error("Project exceeds the 30 MB JSON import limit. Export your project and reduce reference images.");
  const id = existingId && /^[a-zA-Z0-9_-]{8,80}$/.test(existingId) ? existingId : crypto.randomUUID();
  const record: ProjectRecord = { id, name: cleanName, updatedAt: new Date().toISOString(), size: new Blob([json]).size };
  let db: IDBDatabase;
  try { db = await openDb(); }
  catch (error) { throw error instanceof Error ? error : new Error("Browser storage unavailable."); }
  try {
    await transact<IDBValidKey>(db, "readwrite", (store) => store.put({ ...record, json }));
  } catch {
    throw new Error("Could not store this project. Browser disk space or storage access may be restricted; export JSON instead.");
  } finally { db.close(); }
  // An older saved project with the same ID is migrated only after the new copy is secure.
  if (listLocalProjects().some((item) => item.id === id)) {
    try { deleteLocalProject(id); } catch { /* Valid IndexedDB copy exists, so retain legacy entry safely. */ }
  }
  return record;
}

export async function readProject(id: string): Promise<SavedProject> {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) throw new Error("Invalid project ID.");
  let db: IDBDatabase;
  try { db = await openDb(); }
  catch {
    return readLocalProject(id);
  }
  try {
    const item = await transact<StoredProject | undefined>(db, "readonly", (store) => store.get(id));
    if (item) return parseSavedProject(item.json);
  } finally { db.close(); }
  return readLocalProject(id);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const cleanName = name.trim().slice(0, 80);
  if (!cleanName) throw new Error("Enter a project name.");
  const db = await openDb();
  try {
    const item = await transact<StoredProject | undefined>(db, "readonly", (store) => store.get(id));
    if (item) {
      await transact<IDBValidKey>(db, "readwrite", (store) => store.put({ ...item, name: cleanName }));
      return;
    }
  } finally { db.close(); }
  const { renameLocalProject } = await import("./localProjects");
  renameLocalProject(id, cleanName);
}

export async function removeProject(id: string): Promise<void> {
  const db = await openDb();
  try { await transact<undefined>(db, "readwrite", (store) => store.delete(id)); }
  finally { db.close(); }
  if (listLocalProjects().some((item) => item.id === id)) deleteLocalProject(id);
}

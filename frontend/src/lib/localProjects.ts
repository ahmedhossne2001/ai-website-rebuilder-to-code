import type { SavedProject } from "./projectBackup";
import { parseSavedProject } from "./projectBackup";

const INDEX_KEY = "ai-rebuilder:projects:index:v1";
const PREFIX = "ai-rebuilder:projects:item:v1:";
const MAX_PROJECT_BYTES = 3_000_000;

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: string;
  size: number;
}

function safeName(value: string): string {
  const name = value.trim().slice(0, 80);
  if (!name) throw new Error("Please enter a project name.");
  return name;
}

export function listLocalProjects(): ProjectRecord[] {
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is ProjectRecord =>
      !!x && typeof x.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(x.id) &&
      typeof x.name === "string" && typeof x.updatedAt === "string" &&
      typeof x.size === "number" && window.localStorage.getItem(PREFIX + x.id) !== null
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch { return []; }
}

export function readLocalProject(id: string): SavedProject {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) throw new Error("Invalid project ID.");
  const data = window.localStorage.getItem(PREFIX + id);
  if (!data) throw new Error("Saved project not found.");
  return parseSavedProject(data);
}

export function saveLocalProject(project: SavedProject, name: string, existingId?: string): ProjectRecord {
  const cleanName = safeName(name);
  const serialized = JSON.stringify(project);
  if (serialized.length > MAX_PROJECT_BYTES) {
    throw new Error("This project is too large for browser storage. Use Save JSON for a full backup.");
  }
  const records = listLocalProjects();
  const id = existingId && records.some((r) => r.id === existingId)
    ? existingId : crypto.randomUUID();
  const record: ProjectRecord = { id, name: cleanName, updatedAt: new Date().toISOString(), size: serialized.length };
  const old = window.localStorage.getItem(PREFIX + id);
  try {
    window.localStorage.setItem(PREFIX + id, serialized);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify([record, ...records.filter((r) => r.id !== id)]));
  } catch {
    // Keep the previous saved project intact if the browser is out of storage.
    if (old === null) window.localStorage.removeItem(PREFIX + id);
    else window.localStorage.setItem(PREFIX + id, old);
    throw new Error("Browser storage is full or unavailable. Download a JSON backup instead.");
  }
  return record;
}

export function renameLocalProject(id: string, name: string): void {
  const records = listLocalProjects();
  if (!records.some((r) => r.id === id)) throw new Error("Project not found.");
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(records.map((r) =>
    r.id === id ? { ...r, name: safeName(name) } : r
  )));
}

export function deleteLocalProject(id: string): void {
  const records = listLocalProjects();
  // Update index first, so failed index writes never orphan a visible project.
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(records.filter((r) => r.id !== id)));
  window.localStorage.removeItem(PREFIX + id);
}

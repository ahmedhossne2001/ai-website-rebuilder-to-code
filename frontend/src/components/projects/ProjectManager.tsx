import { useState } from "react";
import type { ProjectRecord } from "../../lib/localProjects";

interface Props {
  projects: ProjectRecord[];
  currentName: string;
  canSave: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onBackup: (id: string) => void;
  onImportJson: () => void;
  onExportJson: () => void;
}

export default function ProjectManager({
  projects, currentName, canSave, onClose, onSave, onOpen,
  onRename, onDelete, onBackup, onImportJson, onExportJson
}: Props) {
  const [name, setName] = useState(currentName);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="Project Manager" className="flex w-full max-w-2xl flex-col rounded-xl bg-white p-5 text-gray-900 shadow-2xl dark:bg-zinc-900 dark:text-gray-100" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Project Manager</h2>
          <button type="button" className="rounded p-2 hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={onClose} aria-label="Close project manager">✕</button>
        </div>
        <p className="mt-2 text-sm text-gray-500">Named projects are stored in this browser on this computer. Keep JSON backups for important work.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input aria-label="Project name" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm dark:bg-zinc-800" placeholder="Project name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          <button type="button" disabled={!canSave || !name.trim()} className="rounded bg-violet-700 px-3 py-2 text-sm text-white disabled:opacity-40" onClick={() => onSave(name)}>Save current</button>
          <button type="button" disabled={!canSave} className="rounded border px-3 py-2 text-sm disabled:opacity-40" onClick={onExportJson}>Backup current JSON</button>
        </div>
        <div className="mt-3 flex justify-between">
          <h3 className="font-medium">Saved projects ({projects.length})</h3>
          <button type="button" className="text-sm text-violet-700 underline dark:text-violet-300" onClick={onImportJson}>Open JSON backup</button>
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {!projects.length && <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">No named projects yet. Save the current project to add one.</p>}
          {projects.map((p) => (
            <div key={p.id} className="my-2 flex flex-wrap items-center gap-2 rounded-lg border p-3 dark:border-zinc-700">
              <div className="min-w-36 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{new Date(p.updatedAt).toLocaleString()} · {Math.round(p.size / 1024)} KB</p>
              </div>
              <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => onOpen(p.id)}>Open</button>
              <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => onBackup(p.id)}>Backup</button>
              <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => {
                const next = window.prompt("Rename project", p.name);
                if (next !== null) onRename(p.id, next);
              }}>Rename</button>
              <button type="button" className="rounded border border-red-300 px-2 py-1 text-sm text-red-700 dark:text-red-300" onClick={() => {
                if (window.confirm('Delete saved project "' + p.name + '" from this browser? This cannot be undone.')) onDelete(p.id);
              }}>Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

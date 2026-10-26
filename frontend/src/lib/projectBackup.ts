import { Commit } from "../components/commits/types";
import { PromptAsset } from "../types";

export interface SavedProject {
  schema: "ai-website-rebuilder-project";
  version: 1;
  savedAt: string;
  inputMode: "image" | "video" | "text";
  initialPrompt: string;
  referenceImages: string[];
  assetsById: Record<string, PromptAsset>;
  commits: Record<string, Commit>;
  head: string | null;
  latestCommitHash: string | null;
}

export function parseSavedProject(text: string): SavedProject {
  if (text.length > 30_000_000) throw new Error("Project file exceeds the 30 MB limit.");
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("Invalid project JSON."); }
  if (!raw || typeof raw !== "object") throw new Error("Invalid project file.");
  const item = raw as Partial<SavedProject>;
  if (item.schema !== "ai-website-rebuilder-project" || item.version !== 1 ||
      !item.commits || typeof item.commits !== "object" || Array.isArray(item.commits) ||
      !["image", "video", "text"].includes(item.inputMode ?? "") ||
      !Array.isArray(item.referenceImages) ||
      typeof item.initialPrompt !== "string" ||
      !item.assetsById || typeof item.assetsById !== "object" || Array.isArray(item.assetsById) ||
      (item.head !== null && typeof item.head !== "string") ||
      (item.latestCommitHash !== null && typeof item.latestCommitHash !== "string")) {
    throw new Error("Unsupported or incomplete project file.");
  }
  if (item.head && !Object.prototype.hasOwnProperty.call(item.commits, item.head)) {
    throw new Error("Project references a missing version.");
  }
  for (const [hash, commit] of Object.entries(item.commits)) {
    if (!commit || commit.hash !== hash || !Array.isArray(commit.variants) ||
        !commit.variants.length || !commit.variants.every((v) => typeof v.code === "string")) {
      throw new Error("Project contains invalid code versions.");
    }
  }
  return item as SavedProject;
}

export function downloadProjectFile(project: SavedProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-website-project-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

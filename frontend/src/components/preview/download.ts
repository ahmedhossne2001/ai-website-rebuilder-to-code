import toast from "react-hot-toast";
import { HTTP_BACKEND_URL } from "../../config";
import { normalizeBabelCdn } from "../../lib/babelCdn";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function filenameFromContentDisposition(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? "screenshot-to-code-export.zip";
}

export const downloadCode = async (code: string, format: "html" | "react" = "html") => {
  try {
    const response = await fetch(`${HTTP_BACKEND_URL}/api/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        format,
        baseUrl: window.location.href,
      }),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      throw new Error(typeof details.detail === "string" ? details.detail : `Export failed with status ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(
      blob,
      filenameFromContentDisposition(response.headers.get("Content-Disposition"))
    );
  } catch (error) {
    if (format === "react") {
      toast.error(error instanceof Error ? error.message : "React project export failed");
      return;
    }
    console.warn("Falling back to downloading index.html", error);
    downloadBlob(
      new Blob([normalizeBabelCdn(code)], { type: "text/html" }),
      "index.html"
    );
  }
};

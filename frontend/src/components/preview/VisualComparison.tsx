import { useEffect, useState } from "react";
import PreviewComponent from "./PreviewComponent";

interface Props {
  code: string;
  referenceImage?: string;
  device: "desktop" | "mobile";
}

export default function VisualComparison({ code, referenceImage, device }: Props) {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"side" | "overlay">("side");
  const [opacity, setOpacity] = useState(50);
  const reference = uploadedUrl ?? referenceImage;
  useEffect(() => () => {
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
  }, [uploadedUrl]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-100 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <strong>Visual Comparison</strong>
        <label className="cursor-pointer rounded border px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800">
          Choose reference image
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
              window.alert("Reference image must be 10 MB or smaller.");
              return;
            }
            if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
              window.alert("Use PNG, JPEG or WebP for comparison.");
              return;
            }
            setUploadedUrl(URL.createObjectURL(file));
            event.target.value = "";
          }} />
        </label>
        <button type="button" onClick={() => setMode("side")} aria-pressed={mode === "side"} className={`rounded px-3 py-1.5 ${mode === "side" ? "bg-violet-100 text-violet-800" : "border"}`}>Side by side</button>
        <button type="button" onClick={() => setMode("overlay")} aria-pressed={mode === "overlay"} className={`rounded px-3 py-1.5 ${mode === "overlay" ? "bg-violet-100 text-violet-800" : "border"}`}>Overlay</button>
        {mode === "overlay" && <label className="flex items-center gap-2">
          Original {opacity}%
          <input aria-label="Original image opacity" type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
        </label>}
        {uploadedUrl && <button type="button" className="underline" onClick={() => setUploadedUrl(null)}>Use project reference</button>}
      </div>
      {!reference ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
          No reference screenshot is attached to this version. Choose a screenshot above to compare it with the generated page. This comparison does not use AI or send the image to the server.
        </div>
      ) : mode === "side" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-2">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-white">
            <div className="border-b px-3 py-1.5 text-xs font-medium">Original screenshot</div>
            <div className="min-h-0 flex-1 overflow-auto bg-gray-100">
              <img src={reference} alt="Original screenshot reference" className="mx-auto h-full w-full object-contain object-top" />
            </div>
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-white">
            <div className="border-b px-3 py-1.5 text-xs font-medium">Generated preview</div>
            <div className="flex min-h-0 flex-1"><PreviewComponent code={code} device={device} viewMode="fit" /></div>
          </div>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
          <div className="absolute inset-0 flex"><PreviewComponent code={code} device={device} viewMode="fit" /></div>
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden" style={{ opacity: opacity / 100 }}>
            <img src={reference} alt="Original screenshot overlay" className="h-full w-full object-contain object-top" />
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs text-white">Overlay is for visual inspection only; align reference and preview viewport sizes for accurate comparison.</div>
        </div>
      )}
    </div>
  );
}

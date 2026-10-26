import { useEffect, useRef, useState } from "react";
import PreviewComponent from "./PreviewComponent";

interface Props {
  code: string;
  referenceImage?: string;
  device: "desktop" | "mobile";
}
type Mode = "side" | "overlay" | "difference";
const WIDTH = { desktop: 1366, mobile: 375 } as const;

export default function VisualComparison({ code, referenceImage, device }: Props) {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("side");
  const [opacity, setOpacity] = useState(50);
  const [scale, setScale] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [viewportWidth, setViewportWidth] = useState(900);
  const stageRef = useRef<HTMLDivElement>(null);
  const reference = uploadedUrl ?? referenceImage;

  useEffect(() => () => { if (uploadedUrl) URL.revokeObjectURL(uploadedUrl); }, [uploadedUrl]);
  useEffect(() => {
    setScale(100); setOffsetX(0); setOffsetY(0);
    setImageDimensions(null);
    if (!reference) return;
    const img = new Image();
    img.onload = () => setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => setImageDimensions(null);
    img.src = reference;
    return () => { img.onload = null; img.onerror = null; };
  }, [reference, device]);
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const update = () => setViewportWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode, reference]);

  const frameWidth = Math.min(WIDTH[device], viewportWidth);
  const alignment = { width: frameWidth * scale / 100, transform: `translate(${offsetX}px, ${offsetY}px)`, transformOrigin: "top left" as const };
  const image = (additionalClass = "") => (
    <img src={reference} alt="Reference screenshot" className={`absolute left-0 top-0 max-w-none select-none ${additionalClass}`}
      draggable={false} style={alignment} />
  );
  const overlayMode = mode !== "side";

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-100 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <strong>Visual Comparison</strong>
        <label className="cursor-pointer rounded border px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800">
          Choose reference image
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { window.alert("Reference image must be 10 MB or smaller."); return; }
            if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { window.alert("Use PNG, JPEG or WebP."); return; }
            setUploadedUrl(URL.createObjectURL(file));
          }} />
        </label>
        {(["side", "overlay", "difference"] as const).map((value) =>
          <button key={value} type="button" onClick={() => setMode(value)} aria-pressed={mode === value}
            className={`rounded px-3 py-1.5 ${mode === value ? "bg-violet-100 text-violet-800" : "border"}`}>
            {value === "side" ? "Side by side" : value === "overlay" ? "Overlay" : "Difference"}
          </button>
        )}
        {mode === "overlay" && <label className="flex items-center gap-2">
          Original {opacity}%
          <input aria-label="Original image opacity" type="range" min={0} max={100}
            value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
        </label>}
        {uploadedUrl && <button type="button" className="underline" onClick={() => setUploadedUrl(null)}>Use project reference</button>}
      </div>
      {reference && <div className="flex flex-wrap items-center gap-3 border-b bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <span title="Match the screenshot width to the generated page viewport">Auto-fit width: {WIDTH[device]}px viewport</span>
        <label>Zoom {scale}% <input aria-label="Reference zoom" type="range" min={50} max={200} step={1} value={scale} onChange={(e) => setScale(Number(e.target.value))} /></label>
        <label>Horizontal {offsetX}px <input aria-label="Reference horizontal offset" type="range" min={-400} max={400} step={2} value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} /></label>
        <label>Vertical {offsetY}px <input aria-label="Reference vertical offset" type="range" min={-400} max={400} step={2} value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} /></label>
        <button type="button" className="rounded border px-2 py-1" onClick={() => { setScale(100); setOffsetX(0); setOffsetY(0); }}>Reset alignment</button>
        {imageDimensions && <span className="text-gray-500">Source: {imageDimensions.width} × {imageDimensions.height}px</span>}
      </div>}
      {!reference ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
          Choose a screenshot to compare with the generated page. No AI calls are made.
        </div>
      ) : mode === "side" ? (
        <div ref={stageRef} className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-2">
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-lg border bg-white">
            <div className="border-b px-3 py-1.5 text-xs font-medium">Original screenshot</div>
            <div className="relative min-h-0 flex-1 overflow-hidden bg-gray-100">
              <img src={reference} alt="Original screenshot" className="h-full w-full object-contain object-top" />
            </div>
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-white">
            <div className="border-b px-3 py-1.5 text-xs font-medium">Generated preview</div>
            <div className="flex min-h-0 flex-1"><PreviewComponent code={code} device={device} viewMode="fit" /></div>
          </div>
        </div>
      ) : (
        <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-white">
          <div className="absolute inset-0 flex"><PreviewComponent code={code} device={device} viewMode="fit" /></div>
          <div className={`pointer-events-none absolute inset-y-0 overflow-hidden ${device === "mobile" ? "left-1/2 -translate-x-1/2" : "left-0"}`}
            style={{ width: frameWidth }}>
            <div className="absolute inset-0" style={mode === "difference" ?
              { mixBlendMode: "difference", opacity: 1 } : { opacity: opacity / 100 }}>
              {image()}
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
            {overlayMode && mode === "difference"
              ? "Difference blend highlights mismatched areas; it is not a similarity score."
              : "Align image zoom and offsets before assessing visual accuracy."}
          </div>
        </div>
      )}
    </div>
  );
}

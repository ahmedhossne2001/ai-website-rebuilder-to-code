import { useRef, useState } from "react";
import { LuGlobe2 } from "react-icons/lu";
import { HTTP_BACKEND_URL } from "../../../config";
import { Input } from "../../ui/input";
import { toast } from "react-hot-toast";
import { DesignSystemSelectorProps } from "../../settings/DesignSystemSelector";
import { Stack } from "../../../lib/stacks";
import ScreenshotToCodeControls from "../ScreenshotToCodeControls";

interface Props {
  screenshotOneApiKey: string | null;
  doCreate: (
    urls: string[],
    inputMode: "image" | "video",
    textPrompt?: string,
    isAssetExtractionEnabled?: boolean,
  ) => void;
  stack: Stack;
  setStack: (stack: Stack) => void;
  designSystem: DesignSystemSelectorProps;
}

function isFigmaUrl(url: string): boolean {
  return /^https?:\/\/([\w.-]*\.)?figma\.com\//i.test(url.trim());
}

function UrlTab({
  doCreate,
  screenshotOneApiKey,
  stack,
  setStack,
  designSystem,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<null | {
    url: string;
    screenshot: string;
    device: "desktop" | "mobile";
    viewport: { width: number; height: number };
    design: { title: string; headings: string[]; colors: string[]; backgrounds: string[]; fonts: string[]; language?: string; direction?: string; bodyTextSample?: string; visibleElementCount?: number; linkCount?: number; imageCount?: number; documentHeight?: number; sections?: Array<{tag:string;text:string;x:number;y:number;width:number;height:number;fontSize:string}> };
    warnings?: string[];
    capturedFullPage?: boolean;
    sectionsCaptured?: Array<{ y: number; image: string }>;
    limitations: string;
  }>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [fullPage, setFullPage] = useState(false);
  // Selection belongs to the current capture; resetting it prevents stale images being sent.
  const [selectedCaptureIds, setSelectedCaptureIds] = useState<number[]>([0]);
  const [generationConfirmOpen, setGenerationConfirmOpen] = useState(false);

  function capturedImages() {
    if (!analysis) return [];
    return [
      { id: 0, y: 0, label: "First viewport", image: analysis.screenshot },
      ...(analysis.sectionsCaptured ?? []).map((section, i) => ({
        id: i + 1, y: section.y, label: `Section ${i + 2} · ${section.y}px`, image: section.image
      }))
    ];
  }

  function saveCapture(image: string, id: number) {
    if (!/^data:image\/png;base64,/.test(image)) {
      toast.error("Unsupported screenshot format.");
      return;
    }
    const link = document.createElement("a");
    link.href = image;
    link.download = `website-capture-${id + 1}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function requestGeneration() {
    if (!analysis || selectedCaptureIds.length === 0) {
      toast.error("Select at least one screenshot before generating.");
      return;
    }
    setGenerationConfirmOpen(true);
  }

  function confirmGeneration() {
    if (!analysis || selectedCaptureIds.length === 0) return;
    const images = capturedImages().filter((capture) => selectedCaptureIds.includes(capture.id));
    if (images.length === 0) return;
    setGenerationConfirmOpen(false);
    const ordered = images.sort((a, b) => a.y - b.y);
    const guidance = [
      "Rebuild the public-facing page as a single responsive React UI from the attached screenshots.",
      "These images come from the same URL, in page scroll order. Recreate visible sections in that order; do not duplicate persistent header/footer regions.",
      "Preserve Arabic RTL text flow and semantic headings where visible. Do not invent functional backends, forms, or private data.",
      "Screenshots may omit intervening sections; build only what is grounded in the supplied references.",
      `Reference: ${analysis.url}; viewport: ${analysis.viewport.width}x${analysis.viewport.height}; images: ${ordered.length}.`,
      textPrompt.trim()
    ].filter(Boolean).join("\n");
    doCreate(ordered.map((item) => item.image), "image", guidance, isAssetExtractionEnabled);
  }

  async function analyzeOnly() {
    if (!referenceUrl.trim()) { toast.error("Enter an HTTPS website URL."); return; }
    setAnalysis(null);
    setSelectedCaptureIds([0]);
    setGenerationConfirmOpen(false);
    setAnalysisLoading(true);
    try {
      const response = await fetch(`${HTTP_BACKEND_URL}/api/analyze-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: referenceUrl.trim(), device, fullPage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "URL analysis failed.");
      setAnalysis(data);
      setSelectedCaptureIds([0]);
      toast.success("Screenshot and design data captured. Claude was not used.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "URL analysis failed.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  const [referenceUrl, setReferenceUrl] = useState("");
  const [textPrompt, setTextPrompt] = useState("");
  const [isAssetExtractionEnabled, setIsAssetExtractionEnabled] = useState(true);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  async function takeScreenshot() {
    const trimmedReferenceUrl = referenceUrl.trim();

    if (!screenshotOneApiKey) {
      toast.error(
        "Please add a ScreenshotOne API key in Settings. You can also upload screenshots directly in the Upload tab.",
        { duration: 6000 },
      );
      return;
    }

    if (!trimmedReferenceUrl) {
      toast.error("Please enter a URL");
      return;
    }

    if (trimmedReferenceUrl.toLowerCase().startsWith("file://")) {
      toast.error(
        "file:// URLs can't be screenshot. If you're trying to import a local file, please use the Import tab.",
      );
      return;
    }

    if (isFigmaUrl(trimmedReferenceUrl)) {
      toast.error(
        "Direct Figma import is not supported. Take a screenshot of your design or export the artboards as images, then use the Upload tab.",
        { duration: 6000 },
      );
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${HTTP_BACKEND_URL}/api/screenshot`, {
        method: "POST",
        body: JSON.stringify({
          url: trimmedReferenceUrl,
          apiKey: screenshotOneApiKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to capture screenshot");
      }

      const res = await response.json();
      doCreate(
        [res.url],
        "image",
        textPrompt,
        isAssetExtractionEnabled,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to capture screenshot. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleTextKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey && !isLoading) {
      event.preventDefault();
      void analyzeOnly();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-4 dark:border-zinc-800 sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
            <LuGlobe2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Screenshot from URL
            </h3>
            <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-zinc-400">
              Enter a public webpage and we’ll capture it before generating code.
            </p>
          </div>
        </div>

        <div className="space-y-2 px-4 py-4 sm:px-5">
          <label
            htmlFor="reference-url"
            className="block text-xs font-medium text-gray-600 dark:text-zinc-300"
          >
            Website URL
          </label>
          <Input
            id="reference-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            onChange={(event) => { setReferenceUrl(event.target.value); setAnalysis(null); setSelectedCaptureIds([0]); }}
            value={referenceUrl}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isLoading) {
                event.preventDefault();
                void analyzeOnly();
              }
            }}
            className="h-11 w-full"
            data-testid="url-input"
          />
          {isFigmaUrl(referenceUrl) ? (
            <p className="text-xs leading-5 text-amber-600 dark:text-amber-400">
              Direct Figma import isn’t supported. Export your artboards as
              images and use the Upload tab instead.
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              Analyze URL works without an AI key. The separate legacy Capture & Generate button requires ScreenshotOne.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <label className="text-xs">Capture viewport
              <select className="ml-2 rounded border p-2 dark:bg-zinc-800"
                value={device} onChange={(e) => { setDevice(e.target.value as "desktop" | "mobile"); setAnalysis(null); setSelectedCaptureIds([0]); }}>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={fullPage}
              onChange={(e) => { setFullPage(e.target.checked); setAnalysis(null); setSelectedCaptureIds([0]); }} />
              Full Page (bounded)
            </label>
            <button type="button" className="rounded bg-violet-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={analyzeOnly} disabled={analysisLoading || isLoading} data-testid="analyze-url">
              {analysisLoading ? "Analyzing…" : "Analyze URL (no AI)"}
            </button>
            {analysis && <button type="button" className="rounded border px-4 py-2 text-sm disabled:opacity-50"
              onClick={requestGeneration} disabled={analysisLoading || isLoading} data-testid="generate-from-analysis">
              Review & Generate with AI
            </button>}
          </div>
          {analysis && <div className="mt-4 space-y-2 rounded-lg border p-3 dark:border-zinc-700" data-testid="url-analysis-result">
            <p className="text-sm font-semibold">Captured: {analysis.design.title || analysis.url}</p>
            <p className="text-xs text-gray-500">{analysis.device} · {analysis.viewport.width} × {analysis.viewport.height}px viewport · {analysis.capturedFullPage ? "Full page captured" : "First viewport captured"}</p>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox"
                checked={selectedCaptureIds.includes(0)}
                onChange={(e) => setSelectedCaptureIds((prev) => e.target.checked ? [...new Set([...prev, 0])].sort() : prev.filter((id) => id !== 0))} />
                Include first viewport in AI generation
              </label>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => saveCapture(analysis.screenshot, 0)}>Download PNG</button>
            </div>
            <img src={analysis.screenshot} alt="Captured website screenshot" className="max-h-72 w-full rounded border object-contain object-top" />
            {!!analysis.sectionsCaptured?.length && <div className="mt-3 rounded-lg border p-2">
              <p className="mb-2 text-xs font-semibold">Additional page sections ({analysis.sectionsCaptured.length})</p>
              <p className="mb-3 text-xs text-gray-500">Separate bounded screenshots, not a stitched full-page image. JavaScript remains disabled.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {analysis.sectionsCaptured.map((section, i) => (
                  <div key={i} className="overflow-hidden rounded border">
                    <div className="flex flex-wrap items-center justify-between gap-1 bg-gray-100 px-2 py-1 dark:bg-zinc-800">
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox"
                        checked={selectedCaptureIds.includes(i + 1)}
                        onChange={(e) => setSelectedCaptureIds((prev) => e.target.checked
                          ? [...new Set([...prev, i + 1])].sort()
                          : prev.filter((id) => id !== i + 1))} />
                        Section {i + 2} · scroll offset {section.y}px
                      </label>
                      <button type="button" className="rounded border px-2 py-1 text-xs"
                        onClick={() => saveCapture(section.image, i + 1)}>Download</button>
                    </div>
                    <img src={section.image} alt={`Website page section ${i + 2}`} className="w-full object-contain object-top" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>}
            <p className="text-xs"><b>Headings:</b> {analysis.design.headings.join(" · ") || "None found"}</p>
            <p className="text-xs"><b>Text colors:</b> {analysis.design.colors.join(", ") || "Not available"}</p>
            <p className="text-xs"><b>Backgrounds:</b> {analysis.design.backgrounds.join(", ") || "Not available"}</p>
            <p className="text-xs"><b>Fonts:</b> {analysis.design.fonts.join(", ") || "Not available"}</p>
            <p className="text-xs"><b>Language / direction:</b> {analysis.design.language || "Unknown"} / {analysis.design.direction || "Unknown"}</p>
            <p className="text-xs"><b>Visible elements / links / images:</b> {analysis.design.visibleElementCount ?? "?"} / {analysis.design.linkCount ?? "?"} / {analysis.design.imageCount ?? "?"}</p>
            {analysis.design.bodyTextSample && <p className="text-xs"><b>Page text sample:</b> {analysis.design.bodyTextSample}</p>}
            {!!analysis.design.sections?.length && <details className="text-xs"><summary className="cursor-pointer font-semibold">Detected layout elements ({analysis.design.sections.length})</summary>
              <div className="max-h-40 overflow-auto">
                {analysis.design.sections.slice(0, 15).map((item, index) => <p key={index} className="border-b py-1">{item.tag} · {item.width}×{item.height} at ({item.x},{item.y}) · {item.fontSize} · {item.text.slice(0, 70)}</p>)}
              </div>
            </details>}
            {!!analysis.warnings?.length && <div className="rounded bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200"><b>Capture quality warnings:</b>
              <ul className="list-disc pl-5">{analysis.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>
            </div>}
            <p className="text-xs text-amber-700 dark:text-amber-300">{analysis.limitations}</p>
            <p className="text-xs text-gray-500">Selected screenshots for generation: {selectedCaptureIds.length} / {capturedImages().length}. Downloading images is free; AI generation consumes provider API credits. Keep Test Mode on to limit variants.</p>
            {generationConfirmOpen && <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-sm text-amber-950" role="dialog" aria-label="Confirm AI generation">
              <p className="font-semibold">Confirm paid AI generation</p>
              <p className="mt-1">You selected {selectedCaptureIds.length} screenshot(s). They will be sent to your selected AI model. More images can use more tokens and increase provider charges. This action starts generation immediately; your ChatGPT/Claude subscription does not pay for API usage.</p>
              <p className="mt-1">Please confirm that your selected model/API key is configured and that you want to incur possible charges.</p>
              <div className="mt-3 grid max-h-56 grid-cols-2 gap-2 overflow-auto sm:grid-cols-4">
                {capturedImages().filter((image) => selectedCaptureIds.includes(image.id)).map((image) => (
                  <figure key={image.id} className="rounded border border-amber-300 bg-white p-1">
                    <img src={image.image} alt={image.label} className="h-24 w-full object-contain object-top" />
                    <figcaption className="text-[10px] text-gray-600">{image.label}</figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={confirmGeneration} className="rounded bg-violet-700 px-3 py-2 font-medium text-white">Confirm & Generate</button>
                <button type="button" onClick={() => setGenerationConfirmOpen(false)} className="rounded border px-3 py-2">Cancel (no API call)</button>
              </div>
            </div>}
          </div>}
        </div>
      </div>

      <ScreenshotToCodeControls
        textPrompt={textPrompt}
        onTextPromptChange={setTextPrompt}
        textInputRef={textInputRef}
        onTextInputKeyDown={handleTextKeyDown}
        stack={stack}
        setStack={setStack}
        designSystem={designSystem}
        showAssetExtraction
        isAssetExtractionEnabled={isAssetExtractionEnabled}
        onAssetExtractionChange={setIsAssetExtractionEnabled}
        onGenerate={takeScreenshot}
        actionLabel="Capture & Generate (ScreenshotOne)"
        loadingActionLabel="Capturing…"
        isActionLoading={isLoading}
        actionTestId="url-capture"
      />
    </div>
  );
}

export default UrlTab;

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
    design: { title: string; headings: string[]; colors: string[]; backgrounds: string[]; fonts: string[]; language?: string; direction?: string; bodyTextSample?: string; visibleElementCount?: number; linkCount?: number; imageCount?: number; documentHeight?: number; sections?: Array<{tag:string;text:string;x:number;y:number;width:number;height:number;fontSize:string}> };\n    warnings?: string[];
    limitations: string;
  }>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  async function analyzeOnly() {
    if (!referenceUrl.trim()) { toast.error("Enter an HTTPS website URL."); return; }
    setAnalysis(null);
    setAnalysisLoading(true);
    try {
      const response = await fetch(`${HTTP_BACKEND_URL}/api/analyze-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: referenceUrl.trim(), device }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "URL analysis failed.");
      setAnalysis(data);
      toast.success("Screenshot and design data captured. Claude was not used.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "URL analysis failed.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  function generateFromAnalysis() {
    if (!analysis) { toast.error("Analyze a URL first."); return; }
    // The existing image workflow uses the currently selected Test Mode model.
    doCreate([analysis.screenshot], "image", textPrompt, isAssetExtractionEnabled);
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
            onChange={(event) => { setReferenceUrl(event.target.value); setAnalysis(null); }}
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
                value={device} onChange={(e) => { setDevice(e.target.value as "desktop" | "mobile"); setAnalysis(null); }}>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
            <button type="button" className="rounded bg-violet-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={analyzeOnly} disabled={analysisLoading || isLoading} data-testid="analyze-url">
              {analysisLoading ? "Analyzing…" : "Analyze URL (no AI)"}
            </button>
            {analysis && <button type="button" className="rounded border px-4 py-2 text-sm disabled:opacity-50"
              onClick={generateFromAnalysis} disabled={analysisLoading || isLoading} data-testid="generate-from-analysis">
              Generate with selected AI model
            </button>}
          </div>
          {analysis && <div className="mt-4 space-y-2 rounded-lg border p-3 dark:border-zinc-700" data-testid="url-analysis-result">
            <p className="text-sm font-semibold">Captured: {analysis.design.title || analysis.url}</p>
            <p className="text-xs text-gray-500">{analysis.device} · {analysis.viewport.width} × {analysis.viewport.height}px</p>
            <img src={analysis.screenshot} alt="Captured website screenshot" className="max-h-72 w-full rounded border object-contain object-top" />
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
            <p className="text-xs text-gray-500">Generate calls the selected AI API and may incur charges.</p>
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

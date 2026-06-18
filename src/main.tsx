import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import * as mammoth from "mammoth/mammoth.browser";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import "./styles.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface AnalysisResponse {
  report?: string;
  error?: string;
  remaining?: number;
  provider?: string;
}

type Status = "idle" | "extracting" | "analyzing" | "done" | "error";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [report, setReport] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  const canAnalyze = useMemo(() => Boolean(file && extractedText.length > 200 && status !== "analyzing"), [
    file,
    extractedText,
    status,
  ]);

  async function handleFile(nextFile: File | undefined) {
    if (!nextFile) return;

    setFile(nextFile);
    setReport("");
    setError("");
    setExtractedText("");
    setStatus("extracting");

    try {
      const text = await extractText(nextFile);
      setExtractedText(text);
      setStatus("idle");
      if (text.trim().length < 200) {
        setError("提取到的文本太少。扫描版 PDF 暂时需要先 OCR。");
        setStatus("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件解析失败。");
      setStatus("error");
    }
  }

  async function analyze() {
    if (!file || !canAnalyze) return;

    setStatus("analyzing");
    setError("");
    setReport("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          extractedText,
          userMessage,
        }),
      });

      const payload = (await response.json()) as AnalysisResponse;
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? `请求失败：${response.status}`);
      }

      setReport(payload.report ?? "");
      setRemaining(payload.remaining ?? null);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败。");
      setStatus("error");
    }
  }

  return (
    <main className="shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">公益学术诚信初筛</p>
            <h1>Academic Detective</h1>
          </div>
          <span className="badge">AI 初筛</span>
        </header>

        <div className="panes">
          <section className="inputPane">
            <label className="dropzone">
              <input
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                type="file"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <span className="dropTitle">{file ? file.name : "选择 PDF / DOCX / TXT"}</span>
              <span className="dropMeta">
                {file ? formatBytes(file.size) : "文件文本在浏览器中提取，默认不上传原文件"}
              </span>
            </label>

            <label className="field">
              <span>补充说明</span>
              <textarea
                value={userMessage}
                onChange={(event) => setUserMessage(event.target.value)}
                placeholder="例如：重点检查 Figure 2 和统计方法"
              />
            </label>

            <div className="meter">
              <span>已提取字符</span>
              <strong>{extractedText.length.toLocaleString()}</strong>
            </div>

            <button className="primary" disabled={!canAnalyze} onClick={() => void analyze()}>
              {status === "extracting" ? "提取中" : status === "analyzing" ? "分析中" : "开始分析"}
            </button>

            {remaining !== null && <p className="hint">今日剩余免费分析次数：{remaining}</p>}
            {error && <p className="error">{error}</p>}
          </section>

          <section className="reportPane">
            {report ? (
              <article className="report">{report}</article>
            ) : (
              <div className="emptyState">
                <h2>等待论文</h2>
                <p>报告会在这里生成，包含综合评定、可疑点、证据和不确定性。</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

async function extractText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (file.type === "application/pdf" || extension === "pdf") {
    return extractPdfText(file);
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return normalizeText(result.value);
  }

  if (file.type.startsWith("text/") || extension === "txt") {
    return normalizeText(await file.text());
  }

  throw new Error("暂时只支持 PDF、DOCX 和 TXT。");
}

async function extractPdfText(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    pages.push(`\n\n[Page ${pageNumber}]\n${text}`);
  }

  return normalizeText(pages.join(""));
}

function normalizeText(value: string): string {
  return value.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

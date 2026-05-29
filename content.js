(function () {
  "use strict";

  const BTN_ID = "nlm-md-download-btn";

  // ---- Text processing -------------------------------------------------

  // CJK ranges: ideographs, extensions, CJK punctuation, fullwidth forms.
  const CJK = "\\u3400-\\u9fff\\uf900-\\ufaff\\u3000-\\u303f\\uff00-\\uffef";
  // Remove whitespace that sits between two CJK characters. Lookbehind +
  // lookahead so overlapping single-space gaps are all collapsed.
  const CJK_SPACE_RE = new RegExp("(?<=[" + CJK + "])\\s+(?=[" + CJK + "])", "g");

  // CJK punctuation only — the 　-〿 symbols/punctuation block plus the
  // fullwidth ASCII punctuation in ＀-￯, but NOT fullwidth letters or
  // digits (０-９, Ａ-Ｚ, ａ-ｚ). Punctuation should hug
  // whatever is next to it, even a Latin word ("OK 。" -> "OK。").
  const CJK_PUNCT =
    "\\u3000-\\u303f\\uff01-\\uff0f\\uff1a-\\uff20\\uff3b-\\uff40\\uff5b-\\uff65";
  // Strip whitespace immediately before OR after a CJK punctuation mark. Spaces
  // between a Latin word and a CJK *ideograph* (e.g. "用 Python 写") are kept.
  const PUNCT_SPACE_RE = new RegExp(
    "\\s+(?=[" + CJK_PUNCT + "])|(?<=[" + CJK_PUNCT + "])\\s+",
    "g"
  );

  function stripCjkSpaces(text) {
    let prev;
    let out = text;
    // Run until stable (handles long runs of "字 字 字" and chained punctuation).
    do {
      prev = out;
      out = out.replace(CJK_SPACE_RE, "").replace(PUNCT_SPACE_RE, "");
    } while (out !== prev);
    return out;
  }

  let _converter = null;
  function convertT2S(text) {
    try {
      if (!_converter && typeof OpenCC !== "undefined") {
        _converter = OpenCC.Converter({ from: "tw", to: "cn" });
      }
      return _converter ? _converter(text) : text;
    } catch (e) {
      console.warn("[NLM-MD] OpenCC conversion failed:", e);
      return text;
    }
  }

  function processText(text) {
    return convertT2S(stripCjkSpaces(text));
  }

  // ---- DOM extraction --------------------------------------------------

  // Find the container holding the source transcript.
  //
  // IMPORTANT: NotebookLM renders BOTH the open source's transcript AND every
  // chat response with <labs-tailwind-doc-viewer>, and the chat responses use
  // far more indexed citation spans than a raw transcript does. So we must NOT
  // pick "the viewer with the most spans" — that always selects the chat panel.
  //
  // The transcript viewer lives inside <source-viewer> and is never inside the
  // chat panel. Scope to that, and explicitly exclude anything under the chat.
  function getTranscriptContainer() {
    const viewers = Array.from(
      document.querySelectorAll("source-viewer labs-tailwind-doc-viewer")
    ).filter(
      (v) =>
        isVisible(v) &&
        !v.closest("chat-message") &&
        !v.closest("chat-panel") &&
        (v.textContent || "").trim().length > 0
    );
    if (!viewers.length) return null;
    // If more than one (shouldn't normally happen), take the longest.
    return viewers.sort(
      (a, b) => (b.textContent || "").length - (a.textContent || "").length
    )[0];
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // Build markdown text from the transcript container.
  //
  // A NotebookLM audio transcript is rendered as a single block whose utterances
  // are separated by runs of 2+ whitespace chars (one run per spoken turn). We
  // split on those runs to recover one paragraph per utterance, then strip the
  // inter-CJK spaces and convert Traditional -> Simplified.
  function extractMarkdown(container) {
    const blocks = Array.from(
      container.querySelectorAll("paragraph-element-view")
    );
    const raw = blocks.length
      ? blocks.map((b) => b.textContent || "").join("  ")
      : container.textContent || "";

    return raw
      .split(/\s{2,}/)
      .map((t) => processText(t).trim())
      .filter((t) => t.length > 0)
      .join("\n\n");
  }

  function getSourceTitle() {
    // The title lives inside the open <source-viewer> panel.
    const sv = document.querySelector("source-viewer");
    const sels = [".source-title", "[class*='source-title']", "h1", "h2"];
    for (const s of sels) {
      const el = sv ? sv.querySelector(s) : null;
      if (el && el.textContent.trim()) {
        return processText(el.textContent.trim());
      }
    }
    return "NotebookLM transcript";
  }

  function sanitizeFilename(name) {
    return (
      name
        .replace(/[\\/:*?"<>|\n\r\t]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80) || "transcript"
    );
  }

  // ---- Download --------------------------------------------------------

  function downloadMarkdown() {
    const container = getTranscriptContainer();
    if (!container) {
      alert("Couldn't find a transcript on this page. Open an audio source first.");
      return;
    }

    const title = getSourceTitle();
    const body = extractMarkdown(container);
    if (!body) {
      alert("The transcript appears to be empty.");
      return;
    }

    const md = "# " + title + "\n\n" + body + "\n";
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = sanitizeFilename(title) + " " + date + ".md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- Button injection ------------------------------------------------

  function makeButton() {
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.title = "Download transcript as Markdown (spaces removed, Simplified Chinese)";
    btn.innerHTML =
      '<svg class="nlm-md-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 20h14v-2H5v2zM12 4v9.17l-3.59-3.58L7 11l5 5 5-5-1.41-1.41L13 13.17V4h-2z"/>' +
      "</svg><span>Download .md</span>";
    btn.addEventListener("click", downloadMarkdown);
    return btn;
  }

  // Anchor element to mount the button next to: the open source's title.
  function getTitleAnchor() {
    const sv = document.querySelector("source-viewer");
    if (!sv) return null;
    return sv.querySelector(".source-title-container") || null;
  }

  function update() {
    const anchor = getTranscriptContainer() ? getTitleAnchor() : null;
    let btn = document.getElementById(BTN_ID);

    if (anchor) {
      // Mount (or re-mount) the button inside the title container so it sits
      // right next to the "xxx.m4a" file name.
      if (!btn) btn = makeButton();
      if (btn.parentElement !== anchor) anchor.appendChild(btn);
    } else if (btn) {
      btn.remove();
    }
  }

  // NotebookLM is an Angular SPA; content renders/changes dynamically.
  const observer = new MutationObserver(() => {
    // Debounce via rAF to avoid thrashing.
    if (observer._queued) return;
    observer._queued = true;
    requestAnimationFrame(() => {
      observer._queued = false;
      update();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  update();
})();

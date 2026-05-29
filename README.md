# NotebookLM 转写下载器 / NotebookLM Transcript Downloader

> 一个极简的 Chrome 扩展：在 NotebookLM 音频来源的文字转写旁加一个按钮，
> 一键把转写导出成排版整洁的 Markdown（去除中文字间空格、繁体转简体、按说话轮次分段）。
>
> A minimal Chrome extension that adds a button next to a NotebookLM audio
> source's transcript to export it as clean Markdown (inter-character spaces
> removed, Traditional → Simplified, split into paragraphs by speaker turn).

---

## 中文说明

仅在 `notebooklm.google.com` 上生效。当你打开某个音频来源的文字转写后，
**来源标题（如 `xxx.m4a`）旁边**会出现一个蓝色的 **Download .md** 按钮。
点击即可把转写保存为 Markdown 文件，并自动完成以下处理：

1. **去除字间空格** —— NotebookLM 会在每两个中文字之间插入一个空格，这里会把它们去掉；
   中文标点前后的空格也会去掉（例如 `OK 。` → `OK。`）。英文单词、数字两侧的空格会保留
   （例如 `用 Python 写代码` 保持不变）。
2. **繁体转简体** —— 通过内置的 OpenCC 离线完成繁体（台湾）到简体的转换。
3. **按说话轮次分段** —— NotebookLM 用「双空格」标记不同说话轮次的边界。脚本会先按这些
   边界拆分成段落，再去除字间的单空格，因此导出的文件会自然地把不同发言分成独立段落。
   （注意：转写本身不含说话人标签，所以只能区分「换了一轮发言」，无法标出具体是谁在说。）
4. **整理排版** —— 文件以 `# 标题` 开头，每段一行。

### 安装（加载已解压的扩展）

本扩展未上架 Chrome 应用商店，需要用「加载已解压的扩展」方式安装。先获取代码：
克隆本仓库，或在 [Releases](../../releases) 下载最新的 zip 并解压。

1. 把扩展文件夹放在一个**固定位置**（之后请勿删除或移动，Chrome 会一直从这里加载扩展）。
2. 打开 Chrome，进入 `chrome://extensions`。
3. 打开右上角的 **开发者模式**。
4. 点击 **加载已解压的扩展程序**，选择该文件夹。
5. 打开一个 NotebookLM 笔记本，点击某个音频来源，让它的文字转写显示出来。
6. 点击来源标题旁边的蓝色 **Download .md** 按钮。

### 文件说明

- `manifest.json` —— Manifest V3，仅作用于 NotebookLM。
- `content.js` —— 定位转写、处理文本、注入按钮、触发下载。
- `content.css` —— 按钮样式。
- `vendor/opencc-t2cn.js` —— OpenCC 繁→简词库（UMD，离线运行）。

### 说明

- NotebookLM 是一个 Angular 应用，内部属性 ID（如 `_ngcontent-ng-c4155300573`）会随版本变化，
  因此本扩展不依赖它们。脚本通过 `source-viewer` 容器里的 `labs-tailwind-doc-viewer` 定位转写，
  并**排除聊天面板**（`chat-panel` / `chat-message`），避免误抓中间的对话内容。
- 如果某天 Google 改了页面结构、按钮不再出现，需要调整的就是 `content.js` 顶部的
  `getTranscriptContainer()` 选择器。

---

## English

Works **only** on `notebooklm.google.com`. When you open an audio source's text
transcript, a blue **Download .md** button appears **next to the source title
(e.g. `xxx.m4a`)**. Clicking it saves the transcript as a Markdown file that is:

1. **Space-stripped** — the space NotebookLM inserts between every two Chinese
   characters is removed, as are spaces around Chinese punctuation
   (`OK 。` → `OK。`). Spaces around English words and numbers are kept
   (`用 Python 写代码` is left intact).
2. **Converted to Simplified Chinese** — Traditional (Taiwan) → Simplified via
   OpenCC, bundled and run offline.
3. **Split into paragraphs by turn** — NotebookLM marks the boundary between
   speaking turns with a *double space*. The script splits on those boundaries
   first, then removes the single inter-character spaces, so each turn ends up as
   its own paragraph. (Note: the transcript carries no speaker labels, so this
   distinguishes *that a turn changed*, not *who* is speaking.)
4. **Formatted** — a `# title` heading followed by one paragraph per turn.

### Install (load unpacked)

This extension is not on the Chrome Web Store, so install it as an unpacked
extension. First get the code: clone this repo, or download the latest zip from
[Releases](../../releases) and unzip it.

1. Put the extension folder in a **permanent location** (don't delete or move it
   afterwards — Chrome loads the extension from there).
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select that folder.
5. Open a notebook on NotebookLM, click an audio source so its transcript shows.
6. Click the blue **Download .md** button next to the source title.

### Files

- `manifest.json` — Manifest V3, scoped to NotebookLM only.
- `content.js` — finds the transcript, processes text, injects the button, downloads.
- `content.css` — button styling.
- `vendor/opencc-t2cn.js` — OpenCC Traditional→Simplified bundle (UMD, offline).

### Notes

- NotebookLM is an Angular app whose internal attribute IDs
  (e.g. `_ngcontent-ng-c4155300573`) change between builds, so the extension does
  **not** rely on them. It locates the transcript by the `labs-tailwind-doc-viewer`
  element **inside `source-viewer`**, explicitly excluding the chat panel
  (`chat-panel` / `chat-message`) so it never grabs the conversation in the middle.
- If Google changes the transcript markup and the button stops appearing, the
  selectors in `getTranscriptContainer()` (top of `content.js`) are where to adjust.

---

## License

MIT

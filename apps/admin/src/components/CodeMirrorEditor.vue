<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from "vue";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { keymap, Decoration } from "@codemirror/view";
import { defaultKeymap, historyKeymap, history, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentUnit } from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/view";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";
import { codeFolding, foldKeymap } from "@codemirror/language";
import { logger } from "../utils/logger";

const props = defineProps<{
  modelValue: string;
  language?: string;
  readonly?: boolean;
  height?: string;
  minHeight?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const editorContainer = ref<HTMLElement>();
const view = shallowRef<EditorView>();
const resizeObserver = shallowRef<ResizeObserver>();
const readonlyCompartment = new Compartment();

const editorHeight = ref<string>('400px');

// BAT 关键字列表
const batchKeywords = new Set([
  "if", "else", "elseif", "for", "do", "in", "goto", "call", "exit", "return", "rem", "set",
  "setlocal", "endlocal", "shift", "pause", "cls", "echo", "copy", "move",
  "del", "erase", "rd", "rmdir", "md", "mkdir", "cd", "dir", "type",
  "xcopy", "robocopy", "attrib", "ping", "taskkill", "start", "cmd", "powershell",
  "net", "reg", "wmic", "timeout", "choice", "not", "enable", "disable"
]);

// PowerShell 关键字
const ps1Keywords = new Set([
  "if", "elseif", "else", "for", "foreach", "while", "do", "until",
  "switch", "case", "default", "break", "continue", "return", "exit",
  "try", "catch", "finally", "throw", "function", "param", "begin", "end"
]);

// Shell 关键字
const shellKeywords = new Set([
  "if", "then", "else", "elif", "fi", "for", "do", "done", "while", "until",
  "case", "esac", "select", "function", "return", "local", "exit", "break",
  "echo", "cd", "pwd", "ls", "mkdir", "rmdir", "rm", "cp", "mv", "cat",
  "grep", "find", "sed", "awk", "sort", "tail", "head", "wc", "cut",
  "export", "unset", "source", "exec", "eval", "test"
]);

// 运算符
const operators = new Set([
  "==", "!=", "equ", "neq", "lss", "leq", "gtr", "geq",
  "+", "-", "*", "/", "mod", "=", "&", "|", "^", "&&", "||"
]);

// 使用 EditorView.theme 覆盖语法高亮颜色
const editorTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
  },
  ".cm-content": {
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: "13px",
    lineHeight: "21px",
    paddingBottom: "30px"
  },
  ".cm-gutters": {
    backgroundColor: "#f7f7f7",
    border: "none"
  },
  ".cm-gutter": {
    minWidth: "3em"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#e0e0e0"
  },
  ".cm-activeLine": {
    backgroundColor: "#f0f0f0"
  },
  ".cm-cursor": {
    borderLeft: "2px solid #000"
  },
  ".cm-selectionBackground": {
    backgroundColor: "#b4d5fe"
  },
  // 语法高亮覆盖 - 使用 cm- 前缀确保高优先级
  ".cm-content .tok-comment": { color: "#6A9955 !important", fontStyle: "italic" },
  ".cm-content .tok-keyword": { color: "#0000FF !important", fontWeight: "bold" },
  ".cm-content .tok-string": { color: "#A31515 !important" },
  ".cm-content .tok-variableName": { color: "#001080 !important" },
  ".cm-content .tok-operator": { color: "#AF00DB !important" },
  ".cm-content .tok-labelName": { color: "#880000 !important", fontWeight: "bold" },
  ".cm-content .tok-number": { color: "#098658 !important" }
});

// 简单的语法高亮器
function syntaxHighlighter(state: EditorState) {
  const ranges: { from: number; to: number; class: string }[] = [];
  const content = state.doc.toString();
  const lines = content.split('\n');
  const lang = props.language?.toLowerCase();

  let offset = 0;
  for (const line of lines) {
    const trimmedLine = line.trim();

    // 注释处理
    if (lang === 'powershell' || lang === 'ps1') {
      if (trimmedLine.startsWith('#')) {
        ranges.push({ from: offset, to: offset + line.length, class: "tok-comment" });
        offset += line.length + 1;
        continue;
      }
    } else if (lang === 'shell' || lang === 'sh' || lang === 'bash') {
      if (trimmedLine.startsWith('#')) {
        ranges.push({ from: offset, to: offset + line.length, class: "tok-comment" });
        offset += line.length + 1;
        continue;
      }
    } else {
      // BAT 注释
      if (trimmedLine.startsWith('::') || trimmedLine.toLowerCase().startsWith('rem ') ||
          (trimmedLine.startsWith('@') && trimmedLine.slice(1).trim().startsWith('::'))) {
        ranges.push({ from: offset, to: offset + line.length, class: "tok-comment" });
        offset += line.length + 1;
        continue;
      }
    }

    // 标签
    if (trimmedLine.startsWith(':')) {
      ranges.push({ from: offset, to: offset + line.length, class: "tok-labelName" });
      offset += line.length + 1;
      continue;
    }

    // 简单的 token 分析
    const words = line.split(/\s+/);
    let wordOffset = offset;

    for (const word of words) {
      if (!word) {
        wordOffset++;
        continue;
      }

      const lowerWord = word.toLowerCase();
      const wordLen = word.length;

      // 检查关键字
      let keywordsSet = batchKeywords;
      if (lang === 'powershell' || lang === 'ps1') {
        keywordsSet = ps1Keywords;
      } else if (lang === 'shell' || lang === 'sh' || lang === 'bash') {
        keywordsSet = shellKeywords;
      }

      if (keywordsSet.has(lowerWord)) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-keyword" });
      }

      // 字符串
      if (word.startsWith('"') && word.endsWith('"')) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-string" });
      }

      // 变量
      if (word.includes('%') || word.startsWith('$')) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-variableName" });
      }

      // 数字
      if (/^\d+$/.test(word)) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-number" });
      }

      // 运算符
      if (operators.has(word)) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-operator" });
      }

      wordOffset += wordLen + 1;
    }

    offset += line.length + 1;
  }

  return Decoration.set(ranges.map(r =>
    Decoration.mark({ class: r.class }).range(r.from, r.to)
  ));
}

const highlightExtension = EditorView.decorations.compute([], syntaxHighlighter);

// 强制注入完整的 CodeMirror 样式（解决生产环境样式丢失问题）
function injectCodeMirrorStyles() {
  if (typeof document === 'undefined') return;

  const styleId = 'codemirror-injected-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* CodeMirror 基础样式 */
    .cm-editor {
      height: 100% !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    .cm-editor.cm-focused {
      outline: none;
    }
    .cm-scroller {
      overflow: hidden !important;
      font-family: inherit;
    }
    .cm-content {
      overflow: visible !important;
    }
    .cm-content {
      padding: 0;
      caret-color: #000;
    }
    .cm-line {
      padding: 0 2px;
      min-height: 1.2em;
    }
    .cm-gutters {
      background: #f7f7f7;
      color: #999;
      border: none;
    }
    .cm-lineNumbers .cm-gutterElement {
      padding: 0 3px 0 5px;
      min-width: 2em;
      text-align: right;
    }
    .cm-activeLine {
      background: rgba(0, 0, 0, 0.04);
    }
    .cm-activeLineGutter {
      background: rgba(0, 0, 0, 0.06);
    }
    .cm-selectionBackground {
      background: #b4d5fe !important;
    }
    .cm-cursor {
      border-left: 2px solid #000;
    }
    .cm-matchingBracket {
      background-color: rgba(0, 0, 0, 0.15);
    }
    /* 语法高亮颜色 - 使用 cm- 前缀确保更高优先级 */
    .cm-line .tok-comment { color: #6A9955 !important; font-style: italic !important; }
    .cm-line .tok-keyword { color: #0000FF !important; font-weight: bold !important; }
    .cm-line .tok-string { color: #A31515 !important; }
    .cm-line .tok-variableName { color: #001080 !important; }
    .cm-line .tok-operator { color: #AF00DB !important; }
    .cm-line .tok-labelName { color: #880000 !important; font-weight: bold !important; }
    .cm-line .tok-number { color: #098658 !important; }
    /* 滚动条 */
    .cm-scroller::-webkit-scrollbar { width: 10px; height: 10px; }
    .cm-scroller::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 5px; }
    .cm-scroller::-webkit-scrollbar-thumb { background: #888; border-radius: 5px; }
    .cm-scroller::-webkit-scrollbar-thumb:hover { background: #555; }
  `;
  document.head.appendChild(style);
  logger.info('Editor', 'CodeMirror styles injected', { styleId });
}

function updateEditorHeight() {
  if (!view.value) return;

  requestAnimationFrame(() => {
    if (!view.value) return;

    const scrollDom = view.value.scrollDOM;
    if (!scrollDom) return;

    // 根据内容行数计算高度，让内容完整自适应显示
    const doc = view.value.state.doc;
    const lineCount = doc.lines;
    const lineHeight = 21; // 与 CSS 中的 line-height 一致
    // 添加额外的一行高度，确保光标行也能完整显示
    const contentHeight = lineCount * lineHeight + lineHeight + 30; // 多加一行
    const minHeight = Number(props.minHeight || 100);
    const newHeight = Math.max(minHeight, contentHeight);

    if (editorHeight.value !== `${newHeight}px`) {
      editorHeight.value = `${newHeight}px`;
    }
  });
}

onMounted(() => {
  if (!editorContainer.value) {
    logger.error('CodeMirrorEditor', 'editorContainer not found');
    return;
  }

  // 确保样式被注入
  injectCodeMirrorStyles();

  logger.info('CodeMirrorEditor', 'Initializing editor', {
    language: props.language,
    contentLength: props.modelValue?.length || 0,
    readonly: props.readonly
  });

  const extensions = [
    basicSetup,
    editorTheme,
    lineNumbers(),
    highlightActiveLineGutter(),
    readonlyCompartment.of(EditorState.readOnly.of(props.readonly || false)),
    EditorView.lineWrapping,
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...searchKeymap,
      ...lintKeymap,
      { key: "Tab", run: indentWithTab as any }
    ]),
    history(),
    indentUnit.of("  "),
    bracketMatching(),
    highlightSelectionMatches(),
    autocompletion(),
    codeFolding(),
    highlightExtension,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        emit("update:modelValue", content);
        setTimeout(updateEditorHeight, 50);
      }
    })
  ];

  try {
    const state = EditorState.create({
      doc: props.modelValue,
      extensions
    });

    view.value = new EditorView({
      state,
      parent: editorContainer.value
    });

    // 诊断：检查编辑器 DOM 结构
    logger.info('Editor', 'Editor initialized successfully', {
      hasContainer: !!editorContainer.value,
      containerChildCount: editorContainer.value?.childElementCount || 0,
      editorClass: view.value?.dom?.className || 'no-class',
      hasScroller: !!view.value?.scrollDOM
    });

    // 检查注入的样式
    const injectedStyle = document.getElementById('codemirror-injected-styles');
    logger.info('Editor', 'Style check', {
      hasInjectedStyle: !!injectedStyle,
      injectedLength: injectedStyle?.textContent?.length || 0
    });

    setTimeout(updateEditorHeight, 100);

    resizeObserver.value = new ResizeObserver(() => {
      if (view.value) {
        view.value.requestMeasure();
        updateEditorHeight();
      }
    });
    resizeObserver.value.observe(editorContainer.value);
  } catch (error) {
    logger.error('CodeMirrorEditor', 'Failed to initialize editor', error);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (view.value && view.value.state.doc.toString() !== newValue) {
      const transaction = view.value.state.update({
        changes: { from: 0, to: view.value.state.doc.length, insert: newValue }
      });
      view.value.dispatch(transaction);
      updateEditorHeight();
    }
  }
);

watch(
  () => props.readonly,
  (newReadonly) => {
    if (view.value) {
      view.value.dispatch({
        effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(newReadonly || false))
      });
    }
  }
);

watch(
  () => props.language,
  () => {
    if (view.value) {
      view.value.dispatch({});
    }
  }
);

onBeforeUnmount(() => {
  if (view.value) {
    view.value.destroy();
    view.value = undefined;
  }
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = undefined;
  }
});
</script>

<template>
  <div
    ref="editorContainer"
    class="codemirror-editor-container"
    :style="{ height: editorHeight }"
  ></div>
</template>

<style scoped>
.codemirror-editor-container {
  width: 100%;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.codemirror-editor-container :deep(.cm-editor) {
  height: 100%;
}

.codemirror-editor-container :deep(.cm-scroller) {
  overflow: hidden !important;
}
</style>

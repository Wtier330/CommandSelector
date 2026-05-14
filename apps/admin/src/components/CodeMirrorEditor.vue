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

// VBS 关键字
const vbsKeywords = new Set([
  "if", "then", "else", "elseif", "end if", "select", "case", "end select",
  "for", "each", "to", "step", "next", "while", "wend", "do", "loop",
  "function", "sub", "end function", "end sub", "class", "end class",
  "dim", "set", "redim", "const", "public", "private", "option explicit",
  "on error resume next", "on error goto 0", "exit", "return",
  "msgbox", "inputbox", "len", "left", "right", "mid", "trim", "replace",
  "split", "join", "ubound", "isarray", "isdate", "isnull", "isnumeric",
  "isempty", "cstr", "cint", "clng", "cdbl", "cbool", "cdate", "fix", "int"
]);

// Python 关键字
const pythonKeywords = new Set([
  "if", "elif", "else", "for", "while", "break", "continue", "return",
  "def", "class", "try", "except", "finally", "raise", "import", "from",
  "as", "with", "pass", "lambda", "yield", "global", "nonlocal", "assert",
  "del", "in", "not", "and", "or", "is", "True", "False", "None",
  "self", "print", "len", "range", "str", "int", "float", "list", "dict",
  "tuple", "set", "open", "input", "type", "super", "staticmethod", "classmethod"
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
    } else if (lang === 'vbscript' || lang === 'vbs') {
      if (trimmedLine.startsWith("'")) {
        ranges.push({ from: offset, to: offset + line.length, class: "tok-comment" });
        offset += line.length + 1;
        continue;
      }
    } else if (lang === 'python' || lang === 'py') {
      if (trimmedLine.startsWith('#')) {
        ranges.push({ from: offset, to: offset + line.length, class: "tok-comment" });
        offset += line.length + 1;
        continue;
      }
    } else {
      if (trimmedLine.startsWith('::') || trimmedLine.toLowerCase().startsWith('rem ') ||
          (trimmedLine.startsWith('@') && trimmedLine.slice(1).trim().startsWith('::'))) {
        ranges.push({ from: offset, to: offset + line.length, class: "tok-comment" });
        offset += line.length + 1;
        continue;
      }
    }

    if (trimmedLine.startsWith(':')) {
      ranges.push({ from: offset, to: offset + line.length, class: "tok-labelName" });
      offset += line.length + 1;
      continue;
    }

    const words = line.split(/\s+/);
    let wordOffset = offset;

    for (const word of words) {
      if (!word) { wordOffset++; continue; }

      const lowerWord = word.toLowerCase();
      const wordLen = word.length;

      let keywordsSet = batchKeywords;
      if (lang === 'powershell' || lang === 'ps1') keywordsSet = ps1Keywords;
      else if (lang === 'shell' || lang === 'sh' || lang === 'bash') keywordsSet = shellKeywords;
      else if (lang === 'vbscript' || lang === 'vbs') keywordsSet = vbsKeywords;
      else if (lang === 'python' || lang === 'py') keywordsSet = pythonKeywords;

      if (keywordsSet.has(lowerWord)) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-keyword" });
      }
      if (word.startsWith('"') && word.endsWith('"')) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-string" });
      }
      if (word.includes('%') || word.startsWith('$')) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-variableName" });
      }
      if (/^\d+$/.test(word)) {
        ranges.push({ from: wordOffset, to: wordOffset + wordLen, class: "tok-number" });
      }
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

function injectCodeMirrorStyles() {
  if (typeof document === 'undefined') return;
  const styleId = 'codemirror-injected-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .cm-editor {
      height: 100% !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    .cm-editor.cm-focused { outline: none; }
    .cm-scroller {
      overflow: auto !important;
      font-family: inherit;
    }
    .cm-content { padding: 0; caret-color: #000; }
    .cm-line { padding: 0 2px; min-height: 1.2em; }
    .cm-gutters { background: #f7f7f7; color: #999; border: none; }
    .cm-lineNumbers .cm-gutterElement { padding: 0 3px 0 5px; min-width: 2em; text-align: right; }
    .cm-activeLine { background: rgba(0, 0, 0, 0.04); }
    .cm-activeLineGutter { background: rgba(0, 0, 0, 0.06); }
    .cm-selectionBackground { background: #b4d5fe !important; }
    .cm-cursor { border-left: 2px solid #000; }
    .cm-matchingBracket { background-color: rgba(0, 0, 0, 0.15); }
    .cm-line .tok-comment { color: #6A9955 !important; font-style: italic !important; }
    .cm-line .tok-keyword { color: #0000FF !important; font-weight: bold !important; }
    .cm-line .tok-string { color: #A31515 !important; }
    .cm-line .tok-variableName { color: #001080 !important; }
    .cm-line .tok-operator { color: #AF00DB !important; }
    .cm-line .tok-labelName { color: #880000 !important; font-weight: bold !important; }
    .cm-line .tok-number { color: #098658 !important; }
    .cm-scroller::-webkit-scrollbar { width: 10px; height: 10px; }
    .cm-scroller::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 5px; }
    .cm-scroller::-webkit-scrollbar-thumb { background: #888; border-radius: 5px; }
    .cm-scroller::-webkit-scrollbar-thumb:hover { background: #555; }
  `;
  document.head.appendChild(style);
  logger.info('Editor', 'CodeMirror styles injected', { styleId });
}

onMounted(() => {
  if (!editorContainer.value) {
    logger.error('CodeMirrorEditor', 'editorContainer not found');
    return;
  }

  injectCodeMirrorStyles();

  const extensions = [
    basicSetup,
    editorTheme,
    lineNumbers(),
    highlightActiveLineGutter(),
    readonlyCompartment.of(EditorState.readOnly.of(props.readonly || false)),
    EditorView.lineWrapping,
    keymap.of([
      ...defaultKeymap, ...historyKeymap, ...foldKeymap,
      ...completionKeymap, ...searchKeymap, ...lintKeymap,
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
        emit("update:modelValue", update.state.doc.toString());
      }
    })
  ];

  try {
    const state = EditorState.create({ doc: props.modelValue, extensions });
    view.value = new EditorView({ state, parent: editorContainer.value });

    resizeObserver.value = new ResizeObserver(() => {
      if (view.value) view.value.requestMeasure();
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
      view.value.dispatch({
        changes: { from: 0, to: view.value.state.doc.length, insert: newValue }
      });
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
  () => { if (view.value) view.value.dispatch({}); }
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
  <div ref="editorContainer" class="codemirror-editor-container"></div>
</template>

<style scoped>
.codemirror-editor-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border: 1px solid var(--claude-border-warm, #e8e6dc);
  border-radius: 6px;
  box-sizing: border-box;
}

.codemirror-editor-container :deep(.cm-editor) {
  height: 100%;
}
</style>

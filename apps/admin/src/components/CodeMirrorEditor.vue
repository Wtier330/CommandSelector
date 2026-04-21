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
  ".tok-comment": {
    color: "#6A9955",
    fontStyle: "italic"
  },
  ".tok-keyword": {
    color: "#0000FF",
    fontWeight: "bold"
  },
  ".tok-string": {
    color: "#A31515"
  },
  ".tok-variableName": {
    color: "#001080"
  },
  ".tok-operator": {
    color: "#AF00DB"
  },
  ".tok-labelName": {
    color: "#880000",
    fontWeight: "bold"
  },
  ".tok-number": {
    color: "#098658"
  }
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

function updateEditorHeight() {
  if (!view.value) return;

  requestAnimationFrame(() => {
    if (!view.value) return;

    const scrollDom = view.value.scrollDOM;
    if (!scrollDom) return;

    const scrollHeight = scrollDom.scrollHeight;
    const minHeight = Number(props.minHeight || 400);
    const maxHeight = 2000;
    const calculatedHeight = Math.max(minHeight, scrollHeight + 50);
    const newHeight = Math.min(calculatedHeight, maxHeight);

    if (editorHeight.value !== `${newHeight}px`) {
      editorHeight.value = `${newHeight}px`;
    }
  });
}

onMounted(() => {
  if (!editorContainer.value) return;

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

  const state = EditorState.create({
    doc: props.modelValue,
    extensions
  });

  view.value = new EditorView({
    state,
    parent: editorContainer.value
  });

  setTimeout(updateEditorHeight, 100);

  resizeObserver.value = new ResizeObserver(() => {
    if (view.value) {
      view.value.requestMeasure();
      updateEditorHeight();
    }
  });
  resizeObserver.value.observe(editorContainer.value);
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
  overflow: visible;
  position: relative;
  box-sizing: border-box;
}

.codemirror-editor-container :deep(.cm-scroller) {
  overflow: visible !important;
}
</style>

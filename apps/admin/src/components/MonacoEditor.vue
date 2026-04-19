<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import * as monaco from "monaco-editor";

// 配置 Monaco Editor Worker（只执行一次）
if (!(self as any).MonacoEnvironment) {
  (self as any).MonacoEnvironment = {
    getWorker: function (_workerId: string, _: string) {
      try {
        // @ts-ignore
        const worker = new Worker(
          new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url).href,
          {
            type: 'module'
          }
        );
        // 添加错误处理，防止 Worker 初始化失败导致控制台报错
        worker.onerror = () => {};
        return worker;
      } catch (e) {
        // Worker 创建失败时返回 null
        return null as any;
      }
    },
    getWorkerUrl: function (_workerId: string, _: string) {
      // @ts-ignore
      return new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url).href;
    }
  };
}

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
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let resizeObserver: ResizeObserver | null = null;

// 计算编辑器高度（根据内容行数）
const editorHeight = ref<string>('400px');

// 更新编辑器高度
function updateEditorHeight(content: string) {
  const lineCount = content.split('\n').length;
  const lineHeight = 21; // 与编辑器配置中的 lineHeight 一致
  const minHeight = 400;
  const calculatedHeight = lineCount * lineHeight + 40; // 添加一些 padding
  editorHeight.value = `${Math.max(minHeight, calculatedHeight)}px`;
}

// 注册批处理脚本语言
onMounted(() => {
  monaco.languages.register({ id: "batch" });

  // 设置批处理脚本的语法高亮
  monaco.languages.setMonarchTokensProvider("batch", {
    keywords: [
      "if", "else", "elseif", "exist", "defined", "errorlevel", "cmdextversion",
      "for", "do", "in", "goto", "call", "exit", "return", "rem", "set",
      "setlocal", "endlocal", "shift", "pause", "cls", "echo", "type", "copy",
      "move", "del", "erase", "rd", "rmdir", "md", "mkdir", "cd", "chdir",
      "dir", "tree", "find", "findstr", "xcopy", "robocopy", "attrib", "icacls",
      "net", "sc", "tasklist", "taskkill", "ping", "tracert", "ipconfig",
      "netstat", "nslookup", "route", "arp", "shutdown", "restart", "logoff",
      "power", "assoc", "ftype", "path", "ver", "vol", "date", "time",
      "break", "continue", "color", "title", "prompt", "mode", "more", "sort",
      "timeout", "choice", "start", "cmd", "command", "reg", "wmic", "powershell",
      "diskpart", "bcdedit", "format", "convert", "fsutil", "whoami",
      "takeown", "icacls", "chkdsk", "sfc", "dism", "wusa", "robocopy"
    ],
    tokenizer: {
      root: [
        // 注释
        [/^@.*$/, "comment.directive"],
        [/^::.*$/, "comment"],
        [/rem\s.*/i, "comment"],

        // 字符串
        [/"([^"\\]|\\.)*"/, "string"],
        [/('[^']*')/, "string"],

        // 运算符
        [/==|!=|===|!==/, "operator"],
        [/:|==/, "operator"],
        [/equ\b|neq\b|lss\b|leq\b|gtr\b|geq\b/, "operator"],
        [/[\+\-\*\/\^%=<>!&|]/, "operator"],

        // 环境变量
        [/%%[^%]+%%/, "variable.predefined"],
        [/%[^%]+%/, "variable"],

        // 路径和文件名
        [/([a-zA-Z]:)?(\\[^\\]+)+\\?/, "string.path"],
        [/([a-zA-Z]:)?(\/[^\/]+)+\/?/, "string.path"],

        // 关键字
        [/(goto|call|set|if|for|do|in|echo|exit|pause|cls|rem|shift|setlocal|endlocal|cd|md|rd|del|copy|move|dir|type|ping|net|taskkill|tasklist|start|cmd|powershell|reg|wmic|whoami|takeown|icacls|attrib|timeout|choice|break|continue|color|title|prompt|mode|more|sort|find|findstr|xcopy|robocopy|chkdsk|sfc|dism|shutdown)\b/i, "keyword"],

        // 标签
        [/:\w+/, "label"],

        // 特殊变量
        [/errorlevel\b/i, "variable.special"],
        [/cd\b/i, "keyword"],
        [/cls\b/i, "keyword"],
        [/pause\b/i, "keyword"],

        // 数字
        [/\d+/, "number"],

        // 括号
        [/[(){}\[\]]/, "delimiter.bracket"],
      ],
    },
  });

  // 注册自定义主题
  monaco.editor.defineTheme("vs-custom", {
    base: "vs",
    inherit: true,
    rules: [
      // 注释
      { token: "comment", foreground: "6A9955", fontStyle: "italic" },
      { token: "comment.directive", foreground: "6A9955", fontStyle: "italic" },

      // 关键字
      { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
      { token: "keyword.control", foreground: "AF00DB" },
      { token: "keyword.operator", foreground: "AF00DB" },

      // 运算符
      { token: "operator", foreground: "AF00DB" },

      // 字符串
      { token: "string", foreground: "A31515" },
      { token: "string.path", foreground: "098658" },

      // 变量
      { token: "variable", foreground: "001080" },
      { token: "variable.predefined", foreground: "A31515", fontStyle: "bold" },
      { token: "variable.special", foreground: "D73A49", fontStyle: "bold" },

      // 标签
      { token: "label", foreground: "880000", fontStyle: "bold" },

      // 分隔符
      { token: "delimiter.bracket", foreground: "000000" },

      // 数字
      { token: "number", foreground: "098658" },
    ],
    colors: {},
  });

  // 创建编辑器实例
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language || "batch",
      theme: "vs-custom",
      readOnly: props.readonly || false,
      minimap: { enabled: false }, // 禁用 minimap
      fontSize: 13,
      lineHeight: 21,
      fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
      lineNumbers: "on",
      lineNumbersMinChars: 3,
      glyphMargin: true,
      folding: true,
      foldingStrategy: "auto",
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      automaticLayout: false,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      scrollbar: {
        vertical: "hidden",
        horizontal: "auto",
        useShadows: false,
        verticalScrollbarSize: 0,
        horizontalScrollbarSize: 10,
        verticalHasArrows: false,
        horizontalHasArrows: false,
      },
      mouseWheelScrollSensitivity: 0,
      fastScrollSensitivity: 0,
      renderWhitespace: "selection",
      cursorStyle: "line",
      cursorWidth: 2,
      selectOnLineNumbers: true,
      renderLineHighlight: "all",
      bracketPairColorization: {
        enabled: true
      },
      guides: {
        bracketPairs: true,
        indentation: true
      },
    });

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      if (editor) {
        const content = editor.getValue();
        emit("update:modelValue", content);
        updateEditorHeight(content);
      }
    });

    // 初始化高度
    updateEditorHeight(props.modelValue);

    // 使用 ResizeObserver 来响应式调整编辑器大小
    resizeObserver = new ResizeObserver(() => {
      if (editor) {
        editor.layout();
      }
    });
    resizeObserver.observe(editorContainer.value);
  }
});

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && editor.getValue() !== newValue) {
      const position = editor.getPosition();
      editor.setValue(newValue);
      if (position) {
        editor.setPosition(position);
      }
    }
  }
);

// 监听语言变化
watch(
  () => props.language,
  (newLanguage) => {
    if (editor) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage || "batch");
      }
    }
  }
);

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
    editor = null;
  }
  if (resizeObserver && editorContainer.value) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<template>
  <div
    ref="editorContainer"
    class="monaco-editor-container"
    :style="{ height: editorHeight }"
  ></div>
</template>

<style scoped>
.monaco-editor-container {
  width: 100%;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}
</style>
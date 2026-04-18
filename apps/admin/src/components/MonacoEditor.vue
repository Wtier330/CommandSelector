<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import * as monaco from "monaco-editor";

// 配置 Monaco Editor Worker（只执行一次）
if (!(self as any).MonacoEnvironment) {
  (self as any).MonacoEnvironment = {
    getWorker: function (_workerId: string, _: string) {
      // @ts-ignore
      return new Worker(
        new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url).href,
        {
          type: 'module'
        }
      );
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

// 注册批处理脚本语言
onMounted(() => {
  monaco.languages.register({ id: "batch" });

  // 设置批处理脚本的语法高亮
  monaco.languages.setMonarchTokensProvider("batch", {
    tokenizer: {
      root: [
        [/^@.*$/, "comment.directive"],
        [/^::.*$/, "comment"],
        [/:|==/, "operators"],
        [/%%[^%]+%%/, "variable.predefined"],
        [/%[^%]+%/, "variable"],
        [/rem\b.*/i, "comment"],
        [/goto\s+\w+/i, "keyword"],
        [/call\s+/, "keyword"],
        [/set\s+/i, "keyword"],
        [/if\b/, "keyword"],
        [/else\b/, "keyword"],
        [/for\b/, "keyword"],
        [/do\b/, "keyword"],
        [/echo\b/, "keyword"],
        [/exit\b/, "keyword"],
        [/cd\b/, "keyword"],
        [/cls\b/, "keyword"],
        [/pause\b/, "keyword"],
        [/shift\b/, "keyword"],
        [/setlocal\b/, "keyword"],
        [/endlocal\b/, "keyword"],
        [/not\b/, "keyword"],
        [/equ\b|neq\b|lss\b|leq\b|gtr\b|geq\b/, "keyword.operator"],
        [/errorlevel\b/, "variable"],
      ],
    },
  });

  // 设置 PowerShell 的语法高亮（Monaco 已内置）
  // 注册自定义主题
  monaco.editor.defineTheme("vs-custom", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6A9955" },
      { token: "comment.directive", foreground: "6A9955", fontStyle: "italic" },
      { token: "keyword", foreground: "0000FF" },
      { token: "keyword.operator", foreground: "AF00DB" },
      { token: "operators", foreground: "AF00DB" },
      { token: "variable", foreground: "001080" },
      { token: "variable.predefined", foreground: "A31515" },
      { token: "string", foreground: "A31515" },
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
      minimap: { enabled: true },
      fontSize: 13,
      lineNumbers: "on",
      glyphMargin: true,
      folding: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      automaticLayout: false,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        useShadows: true,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        ignoreHorizontalScrollbarInContentHeight: true,
      },
      mouseWheelScrollSensitivity: 1,
      fastScrollSensitivity: 5,
    });

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      if (editor) {
        emit("update:modelValue", editor.getValue());
      }
    });

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
  ></div>
</template>

<style scoped>
.monaco-editor-container {
  width: 100%;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  flex: 1;
  min-height: 400px;
  position: relative;
  box-sizing: border-box;
}
</style>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import * as monaco from "monaco-editor";

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

// 注册批处理脚本语言
onMounted(() => {
  // 注册批处理脚本语言
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
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        useShadows: true,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      if (editor) {
        emit("update:modelValue", editor.getValue());
      }
    });
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
});
</script>

<template>
  <div
    ref="editorContainer"
    class="monaco-editor-container"
    :style="{ height: height, minHeight: minHeight }"
  ></div>
</template>

<style scoped>
.monaco-editor-container {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
</style>

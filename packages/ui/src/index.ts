export { default as CommandBrowser } from "./CommandBrowser.vue";
export { default as BottomStatusBar } from "./components/BottomStatusBar.vue";
export { default as CommandTrash } from "./components/CommandTrash.vue";
export { default as CategoryManageDialog } from "./components/CategoryManageDialog.vue";
export { default as SettingsModal } from "./components/SettingsModal.vue";
export { default as ProjectInfoModal } from "./components/ProjectInfoModal.vue";
export { default as ModeSwitcher } from "./components/ModeSwitcher.vue";
export { default as ScriptCard } from "./components/ScriptCard.vue";
export { default as ScriptCardGridView } from "./components/ScriptCardGridView.vue";
export { default as ScriptDedupPopover } from "./components/ScriptDedupPopover.vue";
export { default as AIConfigDialog } from "./components/AIConfigDialog.vue";
export { default as AIPromptConfig } from "./components/AIPromptConfig.vue";
export { default as NotificationDialog } from "./components/NotificationDialog.vue";
export * from "./composables/useResponsiveLayout";
export * from "./composables/useScriptMetadata";
export * from "./composables/useScriptTemplates";
export * from "./composables/useKeyboardShortcuts";
export * from "./composables/useCommandEdit";
export * from "./composables/useParamEdit";
export * from "./composables/useAIMetadata";
export * from "./composables/useCommandAIMetadata";
export * from "./composables/usePinyinSearch";
export * from "./composables/useScriptDedup";
export * from "./utils/scriptCommentParser";
export * from "./utils/commentTemplates";
export {
  getVbsCommentTemplate,
  getShellCommentTemplate,
  getPythonCommentTemplate,
  getVbsCommentTemplateWithPlaceholder,
  getShellCommentTemplateWithPlaceholder,
  getPythonCommentTemplateWithPlaceholder
} from "./utils/commentTemplates";
export * from "./utils/searchConfig";
export type { AIProvider, AIProviderConfig, AIMultiConfig } from "./utils/aiConfig";
export type { AIPromptTemplates } from "./utils/promptConfig";
export {
  promptConfigManager,
  DEFAULT_METADATA_PROMPT,
  DEFAULT_COMMAND_PROMPT,
  METADATA_TEMPLATE_VARIABLES,
  COMMAND_TEMPLATE_VARIABLES
} from "./utils/promptConfig";
export * from "./services/aiService";

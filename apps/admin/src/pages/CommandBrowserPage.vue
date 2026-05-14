<script setup lang="ts">
	import { computed, onMounted, onUnmounted, ref } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { CommandBrowser, CommandTrash, BottomStatusBar, CategoryManageDialog } from "../../../../packages/ui/src";
	import ScriptManageDialog from "../components/ScriptManageDialog.vue";
	import ScriptEditorDialog from "../components/ScriptEditorDialog.vue";
	import { useLibraryStore } from "../store/library";
	import { useScriptsStore } from "../store/scripts";
	import { isTauri } from "@tauri-apps/api/core";
	import { useMessage } from "../composables/useMessage";
	import type { ScriptType } from "@commandselector/shared";

	const message = useMessage();

	const router = useRouter();
	const route = useRoute();

	const { commands, trashedCommands, isLoaded, errorMsg, loadLibrary, exportLibrary, importLibrary, saveCommand, moveToTrash, restoreCommand, deletePermanently, emptyTrash, addCategory, deleteCategory, librarySource, lastUpdateTime } = useLibraryStore();
	const { scripts, loadScripts, updateScript, updateScriptMeta } = useScriptsStore();

	const showTrashModal = ref(false);
	const showScriptManageModal = ref(false);
	const showCategoryManageModal = ref(false);
	const currentMode = ref<'command' | 'script'>('command');
	const showScriptEditorDialog = ref(false);
	const editingScriptId = ref("");
	const editingScriptName = ref("");
	const editingScriptType = ref<ScriptType>("bat");

	function handleCsOpenTrash() {
	  showTrashModal.value = true;
	}

	const selectedId = computed(() => String(route.query.id ?? ""));

	const scaleOverride = computed(() => {
	  const raw = String(route.query.scale ?? "").trim();
	  if (!raw) return { scaleOverride: "auto" as const };
	  const n = Number(raw);
	  const scaleOverride = Number.isFinite(n) ? n : ("auto" as const);
	  return { scaleOverride };
	});

	function onSelect(id: string) {
	  router.replace({ name: "commands", query: { ...route.query, id } });
	}

	async function onCreate() {
	  const newId = "cmd-" + Date.now();
	  const newCommand = {
	    id: newId,
	    name: "新建命令",
	    description: "",
	    category: "未分类",
	    tags: [],
	    engine: "cmd" as const,
	    template: "",
	    params: [],
	    platform: "windows" as const,
	    usage: ""
	  };
	  await saveCommand(newCommand);
	  router.replace({ name: "commands", query: { ...route.query, id: newId } });

	  setTimeout(() => {
	    const browserRefValue = (window as any).__browserRef;
	    if (browserRefValue && browserRefValue.startEdit) {
	      browserRefValue.startEdit();
	    }
	  }, 100);
	}

	function handleImport() {
	  if (isTauri()) {
	    // 在 Tauri 环境中直接调用 importLibrary（会触发原生选择文件弹窗）
	    importLibrary().then((success) => {
	      if (success) message.success("导入成功！");
	    });
	  } else {
	    // 网页端降级：利用 input file 选择文件
	    const input = document.createElement("input");
	    input.type = "file";
	    input.accept = ".json";
	    input.onchange = (e) => {
	      const file = (e.target as HTMLInputElement).files?.[0];
	      if (!file) return;
	      const reader = new FileReader();
	      reader.onload = async (ev) => {
	        const content = ev.target?.result as string;
	        if (content) {
	          const success = await import (content);
	          if (success) message.success("导入成功！");
	        }
	      };
	      reader.readAsText(file);
	    };
	    input.click();
	  }
	}

	function handleExport() {
	  exportLibrary();
	}

	function handleDelete(id: string) {
	  moveToTrash(id);
	  if (selectedId.value === id) {
	    router.replace({ name: "commands", query: { ...route.query, id: undefined } });
	  }
	}

	function handleRestoreTrash(id: string) {
	  restoreCommand(id);
	}

	function handleDeletePermanently(id: string) {
	  deletePermanently(id);
	}

	function handleEmptyTrash() {
	  emptyTrash();
	}

	function handleCsImport() {
	  handleImport();
	}

	function handleCsExport() {
	  handleExport();
	}

	async function handleImportCommand(command: any) {
	  await saveCommand(command);
	}

	function handleAddCategory(category: string) {
	  addCategory(category);
	}

	function handleDeleteCategory(category: string, action: "move" | "clear", targetCategory?: string) {
	  deleteCategory(category, action, targetCategory);
	}

	function handleRequestSystemInfo() {
	  window.dispatchEvent(new CustomEvent("cs-system-info-response", {
	    detail: {
	      librarySource: librarySource.value || "",
	      lastUpdateTime: lastUpdateTime.value || 0,
	      commandCount: commands.value.length
	    }
	  }));
	}

	function handleCsOpenScriptManage() {
	  showScriptManageModal.value = true;
	}

	function handleCsOpenCategoryManage() {
	  showCategoryManageModal.value = true;
	}

	function handleModeChange(newMode: 'command' | 'script') {
	  currentMode.value = newMode;
	}

	// 脚本相关处理
	function handleEditScript(id: string) {
	  const script = scripts.value.find(s => s.id === id);
	  if (script) {
	    editingScriptId.value = id;
	    editingScriptName.value = script.name;
	    editingScriptType.value = script.type;
	    showScriptEditorDialog.value = true;
	  }
	}


	async function handleSaveScript(id: string, content: string) {
		try {
			await updateScript(id, content);
		} catch (e: any) {
			console.error("Failed to save script:", e);
			message.error(`保存脚本失败: ${e.message}`);
		}
	}

	function handleMoreScript(id: string) {
	  console.log("More script:", id);
	  // TODO: 实现脚本更多操作菜单
	}

	async function handleToggleDedup(id: string) {
	  try {
	    await updateScriptMeta(id, { excludeFromDedup: true });
	    message.success("已排除，不再纳入同名检测");
	  } catch (e: any) {
	    message.error(`排除失败: ${e.message}`);
	  }
	}

	onMounted(() => {
	  loadLibrary();
	  loadScripts();
	  window.addEventListener("cs-import", handleCsImport);
	  window.addEventListener("cs-export", handleCsExport);
	  window.addEventListener("cs-open-trash", handleCsOpenTrash);
	  window.addEventListener("cs-open-script-manage", handleCsOpenScriptManage);
	  window.addEventListener("cs-request-system-info", handleRequestSystemInfo);
	});

	onUnmounted(() => {
	  window.removeEventListener("cs-import", handleCsImport);
	  window.removeEventListener("cs-export", handleCsExport);
	  window.removeEventListener("cs-open-trash", handleCsOpenTrash);
	  window.removeEventListener("cs-open-script-manage", handleCsOpenScriptManage);
	  window.removeEventListener("cs-request-system-info", handleRequestSystemInfo);
	});
</script>

<template>
  <div>
    <div v-if="!isLoaded && !errorMsg" style="padding: 24px; text-align: center; color: #666;">
      正在加载命令库数据...
    </div>
    <div v-else-if="errorMsg" style="padding: 24px; text-align: center; color: #ef4444;">
      {{ errorMsg }}
    </div>
    <div v-else>
      <CommandBrowser
        ref="(el: any) => { (window as any).__browserRef = el; }"
        :commands="commands"
        :scripts="scripts"
        :trashed-commands="trashedCommands"
        :selected-id="selectedId"
        :responsive="scaleOverride"
        :current-mode="currentMode"
        @select="onSelect"
        @create="onCreate"
        @update:command="saveCommand"
        @delete="handleDelete"
        @import:command="handleImportCommand"
        @add-category="handleAddCategory"
        @delete-category="handleDeleteCategory"
        @open-category-manage="handleCsOpenCategoryManage"
        @open-script-manage="handleCsOpenScriptManage"
        @update:mode="handleModeChange"
        @edit-script="handleEditScript"
        @more-script="handleMoreScript"
        @toggle-dedup="handleToggleDedup"
      />
      <BottomStatusBar />
    </div>
    <Transition name="cs-trash-fade">
      <div v-if="showTrashModal" class="cs-trash-overlay" @click.self="showTrashModal = false">
        <CommandTrash
          :trashed-commands="trashedCommands"
          @restore="handleRestoreTrash"
          @delete-permanently="handleDeletePermanently"
          @empty-trash="handleEmptyTrash"
          @close="showTrashModal = false"
        />
      </div>
    </Transition>
    <Transition name="cs-trash-fade">
      <div v-if="showScriptManageModal" class="cs-trash-overlay" @click.self="showScriptManageModal = false">
        <ScriptManageDialog
          @close="showScriptManageModal = false"
          @import-command="handleImportCommand"
        />
      </div>
    </Transition>
    <Transition name="cs-trash-fade">
      <div v-if="showCategoryManageModal" class="cs-trash-overlay" @click.self="showCategoryManageModal = false">
        <CategoryManageDialog
          :categories="commands.map(c => c.category).filter((c): c is string => !!c).filter((c, i, arr) => arr.indexOf(c) === i)"
          :commands="commands"
          @close="showCategoryManageModal = false"
          @add="handleAddCategory"
          @delete="handleDeleteCategory"
        />
      </div>
    </Transition>
    <Transition name="cs-trash-fade">
      <div v-if="showScriptEditorDialog" class="cs-trash-overlay" @click.self="showScriptEditorDialog = false">
        <ScriptEditorDialog
          v-if="editingScriptId"
          :scriptId="editingScriptId"
          :scriptName="editingScriptName"
          :scriptType="editingScriptType"
          @close="showScriptEditorDialog = false"
          @save="handleSaveScript"
        />
      </div>
    </Transition>
  </div>
</template>

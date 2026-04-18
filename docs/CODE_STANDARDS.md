# CommandSelector 代码规范

## 🎯 核心原则

保持代码文件小巧、职责单一，确保 AI 协作效率和代码可维护性。

## 📏 文件大小限制

| 文件类型 | 最大行数 | 建议拆分点 | 紧急阈值 |
|---------|---------|-----------|---------|
| Vue 组件 | 300 行 | 250 行 | 500 行 |
| TypeScript | 400 行 | 350 行 | 600 行 |
| JavaScript | 400 行 | 350 行 | 600 行 |
| Store/State | 300 行 | 250 行 | 500 行 |

## 🧩 组件拆分原则

###### 何时拆分组件

1. **组件超过 250 行时**，考虑拆分
2. **组件包含多个独立功能模块时**，按功能拆分
3. **模板部分超过 100 行时**，考虑提取子组件
4. **逻辑部分超过 150 行时**，提取到 composables
5. **组件过于复杂难以理解时**，拆分为更小的部分

### 拆分策略示例

#### 策略1：功能模块拆分

```vue
<!-- ❌ 不好：一个组件做所有事 -->
<!-- OriginalComponent.vue (400+ lines) -->
<template>
  <Header />
  <Search />
  <List />
  <Pagination />
  <Footer />
</template>

<!-- ✅ 好：按功能拆分 -->
<!-- OriginalComponent.vue (主容器, ~80 lines) -->
<template>
  <HeaderSection />
  <ContentSection />
  <FooterSection />
</template>
```

#### 策略2：逻辑提取到 Composables

```typescript
// ❌ 不好：所有逻辑都在组件内
const isLoading = ref(false);
const users = ref([]);
const error = ref('');

async function fetchUsers() { /* ... */ }
function validateUser(user) { /* ... */ }
function hasPermission(user) { /* ... */ }

// ✅ 好：逻辑拆分到 composables
const { data, isLoading, error, fetchData } = useUserFetch();
const { validate } = useUserValidation();
const { hasPermission } = useUserPermissions();
```

#### 策略3：混合拆分（推荐）

```
ScriptEditorDialog.vue (150 行, 主容器)
├── ScriptMetadataPanel.vue (120 行, 元数据面板)
├── ScriptEditorActions.vue (80 行, 操作按钮)
├── ScriptTemplateManager.vue (100 行, 模板管理)
└── MonacoEditor.vue (复用现有编辑器)

composables/
├── useScriptMetadata.ts (元数据解析)
├── useScriptTemplates.ts (模板管理)
└── useKeyboardShortcuts.ts (快捷键处理)
```

## 🔧 Composables 使用规范

### 创建条件

- **业务逻辑超过 30 行时**，考虑提取
- **逻辑在多处复用时**，必须提取
- **状态管理复杂时**，使用 composable
- **计算属性超过 5 个且相关**，考虑提取

### 命名规范

```typescript
// ✅ 好的命名
useScriptMetadata        // 清晰表达用途
useCommandFilter         // 明确功能
useResponsiveLayout      // 描述特性

// ❌ 不好的命名
useStuff                 // 无意义
useHelper                // 太泛
scriptLogic              // 不是 composable
```

### 返回值规范

```typescript
// ✅ 推荐：明确返回对象
const {
  data,           // 数据
  isLoading,      // 加载状态
  error,          // 错误信息
  fetchData,      // 获取数据方法
  reset           // 重置方法
} = useScriptMetadata(scriptId);

// ⚠️ 避免：过于复杂的嵌套
const result = useComplexLogic();
console.log(result.data.sub.nested.value); // 难以使用
```

### Composables 文件位置

```
packages/ui/src/composables/    # UI 包的 composables
├── useScriptMetadata.ts
├── useCommandFilter.ts
└── useResponsiveLayout.ts

apps/admin/src/composables/   # 应用特定的 composables
└── useAppSettings.ts
```

## 📦 类型定义规范

### 大 Schema 拆分

当单个 `schema.ts` 超过 300 行时，按领域拆分：

```
packages/shared/src/types/
├── index.ts           # 统一导出
├── command.ts         # 命令相关类型
├── script.ts          # 脚本相关类型
├── category.ts        # 分类相关类型
└── common.ts          # 通用类型
```

### 类型复用

```typescript
// ✅ 好：复用共享类型
import type { ScriptFileMeta } from '@commandselector/shared';

// ❌ 避免：重复定义类型
interface LocalScriptMeta {
  id: string;
  name: string;
  // ... 重复定义
}
```

## 🚀 开发流程建议

### 新增功能流程

1. **规划阶段**：确定组件结构，预估行数
2. **开发阶段**：遵循单一职责原则，及时拆分
3. **提交前**：使用 `/audit-large-files` 检查
4. **定期审计**：每月使用 `/audit-large-files` 检查一次

### 重构现有代码流程

1. **审计阶段**：运行 `/audit-large-files` 查看违规文件
2. **优先级排序**：先重构最严重的文件（>500行）
3. **增量重构**：一次只重构一个文件
4. **测试验证**：确保功能完整性

## 📝 文件命名规范

### 组件命名

```vue
<!-- ✅ PascalCase -->
ScriptEditorDialog.vue
CommandSidebar.vue
CategoryManageDialog.vue

<!-- ❌ 避免其他命名风格 -->
scriptEditorDialog.vue
script-editor-dialog.vue
```

### Composables 命名

```typescript
// ✅ use + PascalCase
useScriptMetadata.ts
useCommandFilter.ts

// ❌ 避免其他命名风格
scriptMetadata.ts
use-script-metadata.ts
```

### 工具函数命名

```typescript
// ✅ camelCase
function formatDate(date: Date): string { }
function validateEmail(email: string): boolean { }

// ❌ 避免其他命名风格
function FormatDate(date: Date): string { }
function format_date(date: Date): string { }
```

## 🎨 模板组织规范

### 模板结构

```vue
<template>
  <!-- 1. 根元素，语义化标签 -->
  <div class="script-editor-dialog">
    <!-- 2. 主要内容区域 -->
    <div class="content">
      <!-- ... -->
    </div>

    <!-- 3. 操作区域 -->
    <div class="actions">
      <!-- ... -->
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue';

// 2. Props 和 Emits
const props = defineProps<{ ... }>();
const emit = defineEmits<{ ... }>();

// 3. 响应式状态
const isLoading = ref(false);

// 4. Computed 属性
const isValid = computed(() => { });

// 5. 方法
function handleSubmit() { }
</script>

<style scoped>
/* 样式 */
</style>
```

### 注释规范

```vue
<template>
  <!-- 用户输入区域 -->
  <div class="user-input">
    <!-- ... -->
  </div>
</template>

<script setup lang="ts">
// 获取用户数据
const userData = ref<User | null>(null);

// 验证用户输入
// @param input - 用户输入的字符串
// @returns 验证结果
function validateInput(input: string): boolean {
  // ...
}
</script>
```

## 🔍 常见反模式

### 反模式1：万能组件

```vue
<!-- ❌ 避免：一个组件做所有事情 -->
<template>
  <!-- 搜索、过滤、排序、分页、编辑、删除 -->
</template>
```

### 反模式2：过度拆分

```vue
<!-- ❌ 避免：过度拆分，每个文件只有10行 -->
<HeaderLeft.vue>
<HeaderRight.vue>
<HeaderCenter.vue>
```

### 反模式3：循环依赖

```typescript
// ❌ 避免：组件循环依赖
// ComponentA.vue 引用 ComponentB.vue
// ComponentB.vue 又引用 ComponentA.vue
```

## 🛠️ 故障排查

### 组件过大怎么办？

1. 使用 `/audit-large-files` 找出大文件
2. 查看 [组件拆分原则](#组件拆分原则)
3. 选择合适的拆分策略
4. 重构并测试

### 不知道怎么拆分？

1. 查看 [拆分策略示例](#拆分策略示例)
2. 参考 [命名规范](#文件命名规范)
3. 从功能模块开始拆分

### TypeScript 类型太多怎么办？

1. 按 [类型定义规范](#类型定义规范) 拆分
2. 使用 `index.ts` 统一导出
3. 避免重复定义

## 📚 快速参考

### 检查代码质量
```bash
/audit-large-files
```

### 文件大小限制快速查询
- Vue 组件：300 行
- TypeScript：400 行
- Store：300 行

### 拆分决策树
```
文件超过 250 行？
├─ 是 → 可以拆分
│   ├─ 超过 300 行？
│   │   ├─ 是 → 应该拆分
│   │   └─ 否 → 可选
│   └─ 有多个独立功能？
│       ├─ 是 → 按功能拆分
│       └─ 否 → 提取 composables
└─ 否 → 保持现状
```

## 🎓 学习资源

- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)
- [Vue 3 组件最佳实践](https://vuejs.org/guide/best-practices/)
- [TypeScript 类型系统](https://www.typescriptlang.org/docs/handbook/types-from-types.html)

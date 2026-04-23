# 开发文档

本文档面向希望深入了解 CommandSelector 架构和开发的贡献者。

## 技术栈概览

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Tauri 2 | 轻量级跨平台桌面应用框架 |
| 前端框架 | Vue 3 | 组合式 API (script setup) |
| 语言 | TypeScript | 类型安全的前端开发 |
| UI 组件库 | Naive UI | Vue 3 组件库 |
| 代码编辑器 | CodeMirror 6 | 替代 Monaco Editor |
| 构建工具 | Vite 6 | 快速前端构建 |
| 包管理器 | pnpm | Monorepo workspace |

## 项目架构

### Monorepo 结构

```
CommandSelector/
├── apps/
│   └── admin/                 # Tauri 桌面应用入口
│       ├── src/               # Vue 3 + TypeScript 前端
│       └── src-tauri/         # Rust 后端
├── packages/
│   ├── shared/               # 跨应用共享类型
│   │   └── src/schema.ts     # 核心数据结构定义
│   └── ui/                   # 共享 UI 组件
│       └── src/components/   # 可复用组件
└── docs/                     # 项目文档
```

### 前端架构 (Vue 3)

**页面层** (`apps/admin/src/pages/`)
- `CommandBrowserPage.vue` - 命令浏览器主页
- `CommandEditorPage.vue` - 命令编辑器
- `PublishPage.vue` - 发布页面
- `SettingsPage.vue` - 设置页面

**组件层** (`apps/admin/src/components/`)
- `ScriptEditorDialog.vue` - 脚本编辑器对话框
- `ScriptManageDialog.vue` - 脚本管理对话框
- 等业务组件

**状态层** (`apps/admin/src/store/`)
- `library.ts` - 命令库状态管理
- `scripts.ts` - 脚本管理状态

**逻辑层** (`apps/admin/src/composables/`)
- 业务逻辑提取到这里，保持组件简洁

### Rust 后端架构

```
apps/admin/src-tauri/src/
├── lib.rs            # 主库入口，Tauri 命令导出
├── file_ops.rs       # 文件操作（读写命令库）
├── search.rs         # 搜索功能 + 拼音匹配
├── ai_config.rs      # AI 配置加密存储
├── log_utils.rs      # 日志系统
└── debug.rs          # 调试日志
```

**已有 Rust 实现的模块：**
- `file_ops.rs` - `read_script_file`, `write_script_file`, `delete_script_file`, `copy_script_file`
- `search.rs` - `search_commands`, `search_scripts`（拼音搜索）
- `ai_config.rs` - AI 配置加密存储
- `log_utils.rs` / `debug.rs` - 模块化日志系统

## 数据结构

### 命令数据 (CommandEntry)

```typescript
interface CommandEntry {
  id: string;              // 唯一标识
  name: string;            // 命令名称
  description?: string;    // 命令描述
  category?: string;       // 分类
  tags?: string[];         // 标签
  engine: 'cmd' | 'powershell' | 'cmd2powershell';
  template: string;        // 命令模板，使用 {{param}} 占位符
  params?: ParamDefinition[];
  platform?: 'windows' | 'macos' | 'linux' | 'any';
  usage?: string;           // 使用示例
}
```

### 参数定义 (ParamDefinition)

```typescript
interface ParamDefinition {
  key: string;             // 参数键名
  label: string;           // 显示标签
  type: 'text' | 'path' | 'number' | 'enum' | 'boolean';
  required?: boolean;
  hint?: string;           // 提示文本
  defaultValue?: string;
  validation?: ValidationRule;
}
```

### 参数类型详解

| 类型 | 说明 | 特殊配置 |
|------|------|----------|
| `text` | 文本输入 | `validation.regex` 进行正则校验 |
| `path` | 路径选择 | Tauri 环境调用原生文件选择器 |
| `number` | 数字输入 | - |
| `enum` | 枚举下拉 | `options: [{label, value}]` |
| `boolean` | 布尔开关 | - |

## 开发指南

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/` 下创建或修改 Rust 文件：

```rust
// src-tauri/src/example.rs
#[tauri::command]
pub fn my_command(arg: String) -> Result<String, String> {
    // 业务逻辑
    Ok("result".to_string())
}
```

2. 在 `lib.rs` 中导出：

```rust
mod example;

#[tauri::command]
fn my_command(arg: String) -> Result<String, String> {
    example::my_command(arg)
}
```

### 添加新的前端页面

1. 在 `apps/admin/src/pages/` 创建 Vue 组件
2. 在 `apps/admin/src/router.ts` 注册路由
3. 使用 `usePageTitle` composable 设置页面标题

### 添加共享 UI 组件

1. 在 `packages/ui/src/components/` 创建组件
2. 在 `packages/ui/src/index.ts` 导出
3. 在需要的地方通过 `import { ComponentName } from '@command-selector/ui'` 使用

## 数据存储

### Tauri 环境

- **命令库**: `%APPDATA%/com.witer.commandselector/library.json`
- **回收站**: `%APPDATA%/com.witer.commandselector/trash.json`
- **AI 配置**: `%APPDATA%/com.witer.commandselector/ai-config.json` (加密)
- **日志目录**: `%APPDATA%/com.witer.commandselector/logs/`

### Web 环境（降级）

使用 `localStorage` 存储：
- `cs_library_data` - 命令库数据
- `cs_trash_data` - 回收站数据

## 构建命令

```bash
# 安装依赖
pnpm install

# Web 开发（热重载）
pnpm dev

# Tauri 开发（启动桌面应用）
pnpm tauri dev

# 构建 Web 版本
pnpm build

# 构建 Tauri 桌面应用
pnpm tauri build

# 类型检查
pnpm typecheck

# 测试
pnpm test
```

## 相关文档

- [代码规范](docs/CODE_STANDARDS.md) - 文件大小限制、组件拆分原则
- [设计系统](docs/DESIGN.md) - 配色、字体、组件样式
- [日志系统](docs/LOGGING.md) - 日志配置和使用
- [贡献指南](CONTRIBUTING.md) - 如何参与项目贡献

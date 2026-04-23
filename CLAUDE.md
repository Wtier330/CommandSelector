# CommandSelector 项目说明

## 项目结构
- Monorepo 使用 pnpm workspace
- apps/admin: 主应用（Tauri 桌面应用）
- packages/ui: 共享UI组件库
- packages/shared: 共享类型定义

## 📏 代码规范（重要！）

### 文件大小限制
- **Vue 组件**: 不超过 300 行（建议在 250 行时拆分）
- **TypeScript**: 不超过 400 行（建议在 350 行时拆分）
- **Store 文件**: 不超过 300 行（建议在 250 行时拆分）
- **Rust 文件**: 不超过 300 行（建议在 250 行时拆分）

### 拆分原则
1. 超过 250 行的组件应该考虑拆分
2. 超过 300 行的组件必须拆分
3. 优先提取业务逻辑到 composables
4. 按功能模块拆分 UI 组件
5. 复用现有组件，避免重复代码

### Composables 使用规范
- 业务逻辑超过 30 行时，必须提取到 composable
- 逻辑在多处复用时，必须提取到 composable
- 复杂状态管理，使用 composable
- 命名规范：`use{功能名}.ts`

## 重要文件
- `apps/admin/src/store/scripts.ts`: 脚本存储管理
- `packages/shared/src/schema.ts`: 类型定义
- `docs/CODE_STANDARDS.md`: 详细代码规范（必读）

## 开发建议
- 新增功能前先规划组件结构，预估行数
- 提交前使用 `/audit-large-files` 检查
- 每月定期审计代码质量
- 遇到大文件时及时拆分

## TS/Rust 分工规则

### 优先 Rust 的场景
- 文件系统操作
- 日志记录
- 搜索/过滤/排序等计算密集型操作
- 敏感数据处理（API Key 等）

### 保持 TypeScript 的场景
- AI API 调用（HTTPS 易调试）
- Vue 组件和 Composables（UI 绑定逻辑）
- 业务状态管理（Store）
- 业务逻辑和 UI 交互

### 迁移检查清单
新增功能时自检:
1. [ ] 是否涉及文件 I/O？ -> Rust
2. [ ] 是否是计算密集型？ -> Rust
3. [ ] 是否涉及敏感数据？ -> Rust
4. [ ] 纯 UI 绑定/业务逻辑？ -> TypeScript

### 已有 Rust 实现的模块
- 文件读写：`apps/admin/src-tauri/src/file_ops.rs` - `read_script_file`, `write_script_file`, `delete_script_file`, `copy_script_file`
- 日志系统：`apps/admin/src-tauri/src/log_utils.rs` - `append_log`, `get_log_dir`
- 调试日志：`apps/admin/src-tauri/src/debug.rs` - `read_debug_log`, `get_logs_dir`, `diagnose_logs`
- 搜索功能：`apps/admin/src-tauri/src/search.rs` - `search_commands`, `search_scripts`

### TypeScript 端调用 Rust 的模式
使用 `useRustSearch` composable 封装 Tauri invoke 调用:
- 文件: `packages/ui/src/composables/useRustSearch.ts`

## 快速工具
- 使用 `/audit-large-files` 审计项目中的大文件
- 查看 `docs/CODE_STANDARDS.md` 了解详细规范
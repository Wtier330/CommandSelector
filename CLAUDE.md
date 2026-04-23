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

## 快速工具
- 使用 `/audit-large-files` 审计项目中的大文件
- 查看 `docs/CODE_STANDARDS.md` 了解详细规范
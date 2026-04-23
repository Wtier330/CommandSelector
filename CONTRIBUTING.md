# 贡献指南

感谢你有兴趣为 CommandSelector 贡献代码！本文档将帮助你了解如何参与项目开发。

## 开始之前

### 开发环境要求

- Node.js >= 18
- pnpm >= 10
- Rust >= 1.70 (如果你需要修改 Tauri 后端)

### 环境搭建

```bash
# 克隆项目
git clone https://github.com/witer330/CommandSelector.git
cd CommandSelector

# 安装依赖
pnpm install
```

## 开发流程

### 1. Fork 仓库

点击 GitHub 页面右上角的 **Fork** 按钮，创建你自己的派生仓库。

### 2. 创建功能分支

```bash
git checkout -b feature/YourAmazingFeature
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `refactor/` - 代码重构
- `docs/` - 文档更新

### 3. 开发与调试

```bash
# 启动 Web 开发服务器（热重载）
pnpm dev

# 启动 Tauri 桌面应用（需要 Tauri CLI）
pnpm tauri dev
```

### 4. 确保代码质量

```bash
# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

### 5. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加拼音搜索功能
fix: 修复命令删除后回收站未更新的问题
docs: 更新 README 安装说明
style: 格式化代码（不影响功能）
refactor: 重构搜索模块
test: 添加单元测试
```

### 6. 推送并创建 Pull Request

```bash
git push origin feature/YourAmazingFeature
```

然后在 GitHub 上创建 Pull Request，等待审核。

## 项目结构

```
CommandSelector/
├── apps/
│   └── admin/                 # Tauri 桌面应用
│       ├── src/               # Vue 前端源码
│       │   ├── pages/         # 页面组件
│       │   ├── components/   # 业务组件
│       │   ├── store/         # 状态管理
│       │   └── composables/   # 组合式函数
│       └── src-tauri/         # Rust 后端
├── packages/
│   ├── shared/                # 共享类型定义
│   └── ui/                    # 共享 UI 组件库
├── docs/                      # 详细文档
└── package.json               # Workspace 配置
```

详细的项目架构请参阅 [DEVELOP.md](DEVELOP.md)。

## 代码规范

### 文件大小限制

- **Vue 组件**: 不超过 300 行
- **TypeScript**: 不超过 400 行
- **Rust 文件**: 不超过 300 行
- **Store 文件**: 不超过 300 行

超过限制时请拆分模块。

### Composables 使用规范

- 业务逻辑超过 30 行时，必须提取到 composable
- 逻辑在多处复用时，必须提取到 composable
- 命名规范：`use{功能名}.ts`

### TypeScript/Rust 分工

**优先使用 Rust 的场景：**
- 文件系统操作
- 日志记录
- 搜索/过滤/排序等计算密集型操作
- 敏感数据处理（API Key 等）

**保持 TypeScript 的场景：**
- AI API 调用
- Vue 组件和 Composables
- 业务状态管理
- 业务逻辑和 UI 交互

详细规范请参阅 [docs/CODE_STANDARDS.md](docs/CODE_STANDARDS.md)。

## 报告问题

如果你发现了 Bug 或有新功能建议，请创建 [Issue](https://github.com/witer330/CommandSelector/issues)。

提交 Issue 时，请包含：
- 清晰的标题和描述
- 复现步骤
- 预期行为 vs 实际行为
- 环境信息（操作系统、Tauri 版本等）

## 许可证

通过贡献代码，你同意你的代码将采用 [MIT License](LICENSE) 授权。

## 联系方式

- GitHub Issues: [Issue Tracker](https://github.com/witer330/CommandSelector/issues)
- 项目 Wiki: [Wiki](https://github.com/witer330/CommandSelector/wiki)

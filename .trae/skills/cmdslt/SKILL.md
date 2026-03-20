---
name: cmdslt
description: 涉及到界面设计、业务逻辑设计的时候使用
---

# Windows 运维命令知识库 - 技能配置文档

## 📦 技术栈

### 核心框架
- **React** `18.3+` - 函数组件、Hooks（useState、useEffect）
- **TypeScript** `5.x` - 严格类型检查、接口定义
- **Tailwind CSS** `v4` - 原子化 CSS、响应式设计
- **Tauri** `2.x` - 跨平台桌面应用（Rust + Web）
- **Vite** `6.x` - 构建工具、HMR

### UI 组件
- **shadcn/ui** - 基于 Radix UI 的可定制组件
- **Lucide React** - 图标库

### 包管理
- **pnpm** - 快速、节省空间的包管理器

---

## 🎨 设计系统

### 视觉风格
```yaml
风格参考: JetBrains IDE、VSCode、Raycast
设计原则: 简洁、专业、信息密度高
颜色系统: 灰度为主、蓝色高亮
字体: 系统默认字体
```

### 间距系统
```css
/* 使用 Tailwind spacing scale */
gap-2    /* 8px - 小间距 */
gap-4    /* 16px - 中间距 */
gap-6    /* 24px - 大间距 */
p-4      /* 16px - 卡片内边距 */
p-6      /* 24px - 容器内边距 */
```

### 颜色规范
```css
/* 边框 */
border-gray-200      /* 默认边框 */
border-blue-500      /* 选中边框 */
border-blue-200      /* 说明区边框 */

/* 背景 */
bg-white             /* 主背景 */
bg-gray-50           /* Hover 背景 */
bg-blue-50           /* 选中背景 */
bg-gray-900          /* 代码块背景 */
bg-blue-50           /* 说明区背景 */

/* 文字 */
text-gray-900        /* 主文字 */
text-gray-600        /* 次要文字 */
text-gray-500        /* 辅助文字 */
text-blue-600        /* 强调文字 */
```

---

## 🔧 开发规范

### TypeScript 规范

```typescript
// ✅ 正确：明确的接口定义
interface CommandParameter {
  name: string;
  key: string;
  defaultValue: string;
  description: string;
}

interface CommandDetailData {
  id: string;
  name: string;
  type: 'CMD' | 'PS' | 'Mixed';
  description: string;
  tags: string[];
  parameters: CommandParameter[];
  commandTemplate: string;
  usage: string;
}

// ✅ 正确：组件 Props 类型定义
interface CommandDetailProps {
  command: CommandDetailData;
}

export function CommandDetail({ command }: CommandDetailProps) {
  // ...
}

// ❌ 错误：使用 any
const data: any = {};

// ❌ 错误：缺少类型定义
function MyComponent(props) {
  // ...
}
```

### React Hooks 规范

```typescript
// ✅ 正确：函数初始化器 + 后备值
const [parameterValues, setParameterValues] = useState<Record<string, string>>(() =>
  command.parameters.reduce(
    (acc, param) => ({ ...acc, [param.key]: param.defaultValue || '' }),
    {}
  )
);

// ✅ 正确：useEffect 监听依赖
useEffect(() => {
  const initialValues = command.parameters.reduce(
    (acc, param) => ({ ...acc, [param.key]: param.defaultValue || '' }),
    {}
  );
  setParameterValues(initialValues);
}, [command.id]);

// ✅ 正确：受控组件（添加 || '' 后备值）
<Input
  value={parameterValues[param.key] || ''}
  onChange={(e) => handleParameterChange(param.key, e.target.value)}
/>

// ❌ 错误：可能出现 undefined（非受控组件）
<Input value={parameterValues[param.key]} />
```

### Tailwind CSS 规范

```tsx
// ✅ 正确：使用 Tailwind 布局和颜色类
<div className="flex gap-4 p-6 bg-white border border-gray-200 rounded-lg">
  <Button className="hover:bg-gray-50">按钮</Button>
</div>

// ❌ 错误：使用字体大小、字重、行高类（除非用户明确要求）
<h1 className="text-2xl font-bold leading-tight">
  {/* 应该使用默认样式，或在 theme.css 中定义 */}
</h1>

// ✅ 正确：使用语义化标签 + 默认样式
<h1>{title}</h1>
```

### 组件导出规范

```typescript
// ✅ 正确：命名导出
export function CommandDetail({ command }: CommandDetailProps) {
  // ...
}

// ✅ 正确：App.tsx 必须有 default export
export default function App() {
  // ...
}

// ❌ 错误：其他组件使用 default export
export default function CommandDetail() {
  // ...
}
```

---

## 🎯 业务逻辑

### 命令模板系统

```typescript
// 命令模板格式
const template = "netstat -ano | findstr {{port}}";

// 参数替换逻辑
const generateFinalCommand = () => {
  let finalCommand = command.commandTemplate;
  Object.entries(parameterValues).forEach(([key, value]) => {
    finalCommand = finalCommand.replace(`{{${key}}}`, value);
  });
  return finalCommand;
};

// 占位符规则：{{paramKey}}
// 示例：{{port}}, {{process_name}}, {{service_name}}
```

### 分类系统

```typescript
const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'system', name: '系统信息', icon: '💻' },
  { id: 'network', name: '网络工具', icon: '🌐' },
  { id: 'process', name: '进程管理', icon: '⚙️' },
  { id: 'service', name: '服务管理', icon: '🔧' },
  { id: 'filesystem', name: '文件系统', icon: '📁' },
  { id: 'disk', name: '磁盘管理', icon: '💾' },
  { id: 'user', name: '用户与权限', icon: '👤' },
  { id: 'log', name: '日志分析', icon: '📊' },
  { id: 'security', name: '安全检测', icon: '🔒' },
  { id: 'maintenance', name: '系统维护', icon: '🛠️' }
];
```

### 搜索和过滤

```typescript
// 过滤逻辑
const filteredCommands = commands.filter((cmd) => {
  // 分类过滤
  const matchCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
  
  // 搜索过滤
  const matchSearch = searchQuery === '' || 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  
  return matchCategory && matchSearch;
});
```

---

## 🎨 UI 组件规范

### 卡片式命令列表

```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900">{command.name}</h3>
      <p className="text-sm text-gray-600">{command.description}</p>
    </div>
    <Badge>{command.type}</Badge>
  </div>
</div>
```

### 深色代码块

```tsx
<div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
  <pre className="whitespace-pre-wrap break-all">
    {generateFinalCommand()}
  </pre>
</div>
```

### 信息说明区

```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
  <div className="flex gap-3">
    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="text-sm font-semibold text-blue-900 mb-2">使用说明</h3>
      <p className="text-sm text-blue-800 leading-relaxed">{command.usage}</p>
    </div>
  </div>
</div>
```

---

## 🚫 受保护文件

**禁止修改的系统文件：**
- `/src/app/components/figma/ImageWithFallback.tsx`
- `/pnpm-lock.yaml`
- `/src/styles/theme.css`（除非用户明确要求）

---

## 🔍 运维领域知识

### Windows 命令类型

**CMD 命令**
- 传统命令行工具
- 示例：`ipconfig`, `netstat`, `tasklist`, `sc`

**PowerShell 命令**
- 现代脚本语言
- 示例：`Get-Process`, `Get-Service`, `Test-NetConnection`

**混合命令**
- 同时支持 CMD 和 PS
- 示例：部分系统工具

### 常见运维场景

1. **系统信息** - 查看系统版本、配置、性能
2. **网络诊断** - 端口查询、连接测试、路由追踪
3. **进程管理** - 查看进程、结束进程、资源占用
4. **服务管理** - 启动/停止服务、查询服务状态
5. **文件系统** - 文件查找、权限管理、磁盘清理
6. **磁盘管理** - 磁盘信息、分区管理、碎片整理
7. **用户与权限** - 用户管理、权限分配
8. **日志分析** - 事件日志、错误排查
9. **安全检测** - 端口扫描、权限审计
10. **系统维护** - 系统更新、性能优化

---

## 🚀 扩展功能方向

### 已实现
- ✅ 左侧搜索框 + 分类导航 + 命令列表
- ✅ 右侧四区块布局（基本信息、参数配置、命令预览、使用说明）
- ✅ 参数化命令模板系统
- ✅ 一键复制功能
- ✅ 实时命令预览
- ✅ 15 个示例命令覆盖所有分类

### 待实现（可选）
- ⏳ 命令历史记录（LocalStorage）
- ⏳ 自定义命令模板
- ⏳ 导入/导出配置（JSON/YAML）
- ⏳ 快捷键系统（Ctrl+K 搜索、Ctrl+C 复制）
- ⏳ 深色模式切换
- ⏳ 命令收藏夹
- ⏳ 批量执行
- ⏳ 命令执行历史
- ⏳ 命令标签管理
- ⏳ Tauri 原生交互（调用本地 CMD）

---

## 💡 AI 助手使用指南

### 当你要编写新组件时
1. 检查 `/src/app/components/` 是否有类似组件
2. 使用 TypeScript 定义 Props 接口
3. 使用函数组件 + Hooks
4. 遵循项目的 Tailwind 类名规范
5. 确保受控组件的 value 有后备值

### 当你要修改 UI 样式时
1. 保持 JetBrains/VSCode 风格
2. 使用项目已有的颜色和间距系统
3. 不修改字体大小、字重、行高（除非明确要求）
4. 保持卡片式设计、清晰的视觉层级

### 当你要添加功能时
1. 先理解现有的数据结构
2. 遵循命令模板系统的占位符规则
3. 确保搜索和过滤逻辑正确
4. 添加必要的交互反馈

### 当你遇到问题时
1. 检查 TypeScript 类型定义
2. 确认受控组件的 value 不为 undefined
3. 检查 useEffect 依赖项
4. 查看 Console 错误信息

---

## 📚 参考资源

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Tailwind CSS v4 文档](https://tailwindcss.com/)
- [shadcn/ui 组件库](https://ui.shadcn.com/)
- [Tauri 官方文档](https://tauri.app/)
- [Lucide Icons](https://lucide.dev/)

---

**更新日期：** 2026-03-16
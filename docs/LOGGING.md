# 模块化日志系统使用说明

## 概述

日志系统按模块分类，将日志写入到应用本地数据目录下的 `logs` 文件夹中，每个模块对应一个单独的日志文件。

## 日志目录位置

### Windows
```
C:\Users\{用户名}\AppData\Local\commandselector\logs\
```

### macOS
```
~/Library/Application Support/commandselector/logs/
```

### Linux
```
~/.local/share/commandselector/logs/
```

## 使用方法

### 基本日志记录

```typescript
import { logger } from './utils/logger';

// Info 级别
logger.info('模块名', '消息内容');
logger.info('CodeMirrorEditor', '编辑器已初始化');

// Warn 级别
logger.warn('模块名', '警告消息', { additionalData });

// Error 级别
logger.error('模块名', '错误消息', error);

// Debug 级别
logger.debug('模块名', '调试信息', debugData);
```

### 模块命名规范

使用有意义的模块名，建议使用以下格式：

```typescript
// 组件模块
logger.info('CodeMirrorEditor', '...');
logger.info('ScriptEditorDialog', '...');
logger.info('CommandBrowser', '...');

// Store 模块
logger.info('ScriptStore', '...');
logger.info('LibraryStore', '...');

// Composable 模块
logger.info('useScriptMetadata', '...');
logger.info('useScriptTemplates', '...');

// Service 模块
logger.info('AIService', '...');
logger.info('SearchService', '...');
```

### 带数据的日志

```typescript
logger.info('App', '应用启动', {
  version: '1.3.3',
  platform: navigator.platform,
  tauri: isTauri()
});

logger.error('CodeMirrorEditor', '初始化失败', {
  language: props.language,
  error: error.message,
  stack: error.stack
});
```

## 查看日志

### 方法 1: 使用提供的脚本

#### Windows
```bash
# 双击运行
scripts/view-debug-log.bat

# 或通过命令行
pnpm view-debug-log
```

#### macOS/Linux
```bash
node scripts/view-debug-log.mjs
```

脚本会：
1. 列出所有可用的日志模块
2. 让你选择要查看的模块
3. 显示最近的日志条目
4. 自动打开完整的日志文件

### 方法 2: 直接打开日志目录

1. 运行日志查看脚本
2. 记录显示的日志目录路径
3. 在文件资源管理器中打开该目录

### 方法 3: 在应用中读取日志（需要 Tauri 命令）

```typescript
import { invoke } from '@tauri-apps/api/core';

// 获取日志目录
const logsDir = await invoke('get_logs_dir');

// 列出所有可用的日志模块
const moduleList = await invoke('read_debug_log');
console.log(moduleList);

// 读取特定模块的日志
const codemirrorLog = await invoke('read_debug_log', { module: 'CodeMirrorEditor' });
console.log(codemirrorLog);
```

## 日志文件格式

```
[2024-01-15T10:30:45.123Z] [INFO] 编辑器已初始化
[2024-01-15T10:30:46.456Z] [ERROR] 加载脚本失败
{
  "scriptId": "123",
  "error": "File not found",
  "path": "/scripts/test.ps1"
}
[2024-01-15T10:30:47.789Z] [WARN] 配置文件缺失，使用默认值
```

## 调试建议

### 1. 关键节点添加日志

```typescript
// 在组件/函数的关键节点添加日志
onMounted(() => {
  logger.info('MyComponent', '组件挂载');
  // ...
});

async function loadData() {
  logger.info('MyComponent', '开始加载数据');
  try {
    // ...
    logger.info('MyComponent', '数据加载成功', { count: data.length });
  } catch (error) {
    logger.error('MyComponent', '数据加载失败', error);
  }
}
```

### 2. 性能日志

```typescript
const startTime = performance.now();
// ... 执行操作
const duration = performance.now() - startTime;
logger.info('MyComponent', '操作完成', { duration: `${duration.toFixed(2)}ms` });
```

### 3. 状态变化日志

```typescript
watch(() => someRef.value, (newValue, oldValue) => {
  logger.debug('MyComponent', '状态变化', {
    oldValue,
    newValue
  });
});
```

## 清理日志

### 清除所有日志

```typescript
await logger.clear();
```

### 手动删除

直接删除 `logs` 文件文件夹即可。

## 注意事项

1. **性能影响**：日志写入是异步的，不会阻塞主线程
2. **磁盘空间**：日志会持续增长，建议定期清理
3. **敏感信息**：避免记录密码、令牌等敏感信息
4. **开发 vs 生产**：
   - 开发环境：日志同时输出到控制台
   - 生产环境：日志写入文件
5. **模块名规范**：使用一致的命名规范，便于查找

## 示例：完整的使用场景

```typescript
import { logger } from '../utils/logger';
import { ref, onMounted } from 'vue';

export function useMyFeature() {
  const isLoading = ref(false);
  const data = ref<any[]>([]);

  async function fetchData() {
    isLoading.value = true;
    logger.info('useMyFeature', '开始获取数据');

    try {
      const result = await apiCall();
      data.value = result;

      logger.info('useMyFeature', '数据获取成功', {
        count: result.length,
        firstId: result[0]?.id
      });
    } catch (error) {
      logger.error('useMyFeature', '数据获取失败', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      isLoading.value = false;
      logger.debug('useMyFeature', '加载状态已重置');
    }
  }

  onMounted(() => {
    logger.info('useMyFeature', '功能已挂载');
  });

  return {
    isLoading,
    data,
    fetchData
  };
}
```

## 常见问题

### Q: 日志没有生成？
A: 检查以下内容：
1. 确保在 Tauri 环境中运行
2. `appLocalDataDir()` 返回的目录是否可写
3. 检查 `logger.ts` 中的初始化日志

### Q: 日志文件太大？
A: 使用 `logger.clear()` 清理，或手动删除 `logs` 文件夹

### Q: 如何在生产环境中禁用日志？
A: 在 `logger.ts` 中添加环境检查：

```typescript
if (import.meta.env.PROD) {
  // 可选择只记录错误级别
  if (level !== 'error') return;
}
```

### Q: 日志丢失了？
A: 检查：
1. 是否在同一模块中多次调用 `init()`
2. 日志目录的磁盘空间是否充足
3. 检查错误日志中是否有写入失败的记录

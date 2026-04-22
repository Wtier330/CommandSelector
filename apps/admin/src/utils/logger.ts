/**
 * 文件日志工具，用于 Tauri release 版本调试
 * 按模块分类写入日志文件到 logs 文件夹
 *
 * 目录通过 Rust get_log_dir 命令获取，优先使用程序安装目录
 * 日志写入通过 Rust append_log 命令实现
 */

interface LoggerEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private entries: Map<string, LoggerEntry[]> = new Map();
  private maxEntries = 500;
  private logsDir = '';
  private initPromise: Promise<void> | null = null;
  private initError: any = null;
  private invoke: any = null;
  private writePending: Map<string, boolean> = new Map();

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInit();

    try {
      await this.initPromise;
    } catch (e) {
      this.initError = e;
      console.warn('[Logger] 初始化失败:', e);
    }
  }

  private async doInit() {
    try {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (!isTauri()) {
        console.log('[Logger] 非 Tauri 环境，日志仅输出到控制台');
        return;
      }

      this.invoke = (await import('@tauri-apps/api/core')).invoke;

      // 通过 Rust 命令获取日志目录
      this.logsDir = await this.invoke('get_logs_dir');
      console.log('[Logger] 日志目录:', this.logsDir);

      // 记录初始化信息
      const initInfo = {
        logsDir: this.logsDir,
        platform: navigator.platform
      };
      this.info('App', 'Logger initialized', initInfo);
    } catch (e) {
      this.initError = e;
      throw e;
    }
  }

  private async appendLog(category: string, entry: LoggerEntry) {
    if (!this.invoke) return;

    try {
      await this.invoke('append_log', {
        entry: {
          category: entry.category,
          level: entry.level,
          message: entry.message,
          data: entry.data ? JSON.stringify(entry.data) : null
        }
      });
    } catch (e) {
      console.error(`[Logger] Failed to append log for ${category}:`, e);
    }
  }

  private async flushCategory(category: string) {
    // 防止重复写入
    if (this.writePending.get(category)) return;
    this.writePending.set(category, true);

    try {
      const entries = this.entries.get(category);
      if (!entries || entries.length === 0) return;

      for (const entry of entries) {
        await this.appendLog(category, entry);
      }

      this.entries.set(category, []);
    } finally {
      this.writePending.delete(category);
    }
  }

  private addEntry(entry: LoggerEntry) {
    // 获取该 category 的日志条目
    let categoryEntries = this.entries.get(entry.category) || [];
    categoryEntries.push(entry);

    // 限制单个 category 的日志条目数量
    if (categoryEntries.length > this.maxEntries) {
      categoryEntries = categoryEntries.slice(-this.maxEntries);
    }

    this.entries.set(entry.category, categoryEntries);

    // 延迟批量写入
    if (this.initPromise) {
      setTimeout(() => {
        this.flushCategory(entry.category);
      }, 100);
    }

    // 同时输出到控制台
    const consoleMethod = entry.level === 'error' ? console.error :
                          entry.level === 'warn' ? console.warn :
                          console.log;
    consoleMethod(`[${entry.category}] ${entry.message}`, entry.data || '');
  }

  info(category: string, message: string, data?: any) {
    this.addEntry({ timestamp: Date.now(), level: 'info', category, message, data });
  }

  warn(category: string, message: string, data?: any) {
    this.addEntry({ timestamp: Date.now(), level: 'warn', category, message, data });
  }

  error(category: string, message: string, data?: any) {
    this.addEntry({ timestamp: Date.now(), level: 'error', category, message, data });
  }

  debug(category: string, message: string, data?: any) {
    this.addEntry({ timestamp: Date.now(), level: 'debug', category, message, data });
  }

  async clear() {
    this.entries.clear();
    // 日志文件清空需要 Rust 端支持，暂时只清空内存
  }

  async getLogsDir(): Promise<string> {
    if (!this.initPromise) {
      await this.init();
    }
    return this.logsDir;
  }

  isReady(): boolean {
    return this.initPromise !== null && this.initError === null && this.logsDir !== '';
  }

  getInitError(): any {
    return this.initError;
  }
}

export const logger = new Logger();

// 自动初始化
logger.init().catch(() => {});

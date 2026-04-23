import { computed, ref, type Ref } from "vue";
import type { ExecMode } from "@commandselector/shared";

export function useCommandFormat(finalCommand: Ref<string>, powershellTemplate?: Ref<string | undefined>) {
  const execMode = ref<ExecMode>("cmd");
  const runAsAdmin = ref(true);
  const silentMode = ref(true);

  const formattedCommand = computed(() => {
    // 根据执行模式选择正确的模板
    let cmd = "";
    if (execMode.value === "powershell" && powershellTemplate?.value?.trim()) {
      // PowerShell 模式：仅使用 PowerShell 模板内容，不 fallback
      cmd = powershellTemplate.value.trim();
    } else if (execMode.value !== "powershell") {
      // CMD 或 CMD→PS 模式：使用 CMD 模板内容
      cmd = finalCommand.value.trim();
    }
    // PowerShell 模式但没有内容时，cmd 为空，不 fallback

    if (!cmd) return "";

    switch (execMode.value) {
      case "powershell":
        return cmd;
      case "cmd2powershell":
        // cmd2powershell 模式下，只使用 PowerShell 模板内容
        const psCmd = powershellTemplate?.value?.trim();
        if (!psCmd) return ""; // 没有 PowerShell 内容时返回空
        return convertToCmd2PowerShell(psCmd, runAsAdmin.value, silentMode.value);
      case "cmd":
      default:
        return cmd;
    }
  });

  function convertToPowerShell(cmd: string): string {
    // 转换为 PowerShell 格式
    // 处理环境变量: %VAR% -> $env:VAR
    let psCmd = cmd;

    // 替换环境变量
    psCmd = psCmd.replace(/%([^%]+)%/g, (_match, varName) => {
      return `$env:${varName}`;
    });

    // 处理路径分隔符
    // PowerShell 支持 / 和 \，但统一使用 / 更好

    // 处理重定向
    // > -> | Out-File, >> -> | Add-Content
    psCmd = psCmd.replace(/>/g, '| Out-File');
    psCmd = psCmd.replace(/\| Add-Content/g, '>>');

    // 处理命令连接符 && -> ;
    psCmd = psCmd.replace(/&&/g, ';');

    // 处理 if 语句
    // if exist file (command) -> if (Test-Path file) { command }
    psCmd = psCmd.replace(/if\s+exist\s+(.*?)\s+\((.*?)\)/gi, (_match, path, command) => {
      return `if (Test-Path "${path.trim()}") { ${command.trim()} }`;
    });

    // 处理管道
    // cmd 的管道 | 在 PowerShell 中兼容，不需要转换

    // 处理引号
    // 将双引号外的百分号转义

    return psCmd;
  }

  function convertToCmd2PowerShell(cmd: string, runAsAdmin: boolean, silentMode: boolean): string {
    // 通过 cmd.exe 调用 PowerShell
    const psCmd = convertToPowerShell(cmd);

    // 对 PowerShell 命令进行转义，使其能在 cmd 中通过 PowerShell.exe 调用
    const escapedCmd = escapeForCmd(psCmd);

    // 构建 PowerShell 参数
    let psArgs = '';
    if (silentMode) {
      psArgs += ' -WindowStyle Hidden';
    }
    if (runAsAdmin) {
      psArgs += ' -ExecutionPolicy Bypass';
    }

    // 如果需要提权执行，使用 Start-Process -Verb RunAs
    if (runAsAdmin) {
      // 构建内部的 PowerShell 命令
      const innerPsCmd = psArgs ? `-Command "${escapedCmd}" ${psArgs.trim()}` : `-Command "${escapedCmd}"`;
      // 使用 Start-Process 提升权限
      return `powershell.exe -WindowStyle Hidden -Command "Start-Process powershell.exe -ArgumentList '${innerPsCmd}' -Verb RunAs"`;
    }

    // 普通执行
    return `powershell.exe${psArgs} -Command "${escapedCmd}"`;
  }

  function escapeForCmd(str: string): string {
    // 在 cmd 中调用 PowerShell 需要转义的特殊字符
    return str
      .replace(/"/g, '\\"')  // 双引号
      .replace(/\$/g, '`$')  // PowerShell 变量符号
      .replace(/`/g, '``')  // 反引号
      .replace(/\n/g, '; ')  // 换行符
  }

  const modeLabels: Record<ExecMode, string> = {
    cmd: "CMD",
    powershell: "PowerShell",
    cmd2powershell: "CMD→PS"
  };

  const modeDescriptions: Record<ExecMode, string> = {
    cmd: "适用于 Windows 命令提示符",
    powershell: "适用于 PowerShell 环境",
    cmd2powershell: "通过 CMD 调用 PowerShell"
  };

  return {
    execMode,
    runAsAdmin,
    silentMode,
    formattedCommand,
    modeLabels,
    modeDescriptions
  };
}

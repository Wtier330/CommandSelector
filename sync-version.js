#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filesToUpdate = [
  path.join(__dirname, 'apps', 'admin', 'package.json'),
  path.join(__dirname, 'apps', 'admin', 'src-tauri', 'tauri.conf.json'),
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function getCurrentVersions() {
  const versions = {};
  console.log('当前版本号：\n');
  filesToUpdate.forEach(filePath => {
    try {
      const data = readJson(filePath);
      const fileName = path.basename(filePath);
      const version = data.version;
      versions[fileName] = version;
      console.log(`  ${fileName}: ${version}`);
    } catch (error) {
      console.error(`  ${path.basename(filePath)}: 读取失败`);
    }
  });
  console.log();
  return versions;
}

function updateVersion(newVersion) {
  // 验证版本号格式 (semver)
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  if (!semverRegex.test(newVersion)) {
    console.error(`错误: 无效的版本号格式 "${newVersion}"`);
    console.error('格式应为: x.y.z (例如: 1.2.3)');
    process.exit(1);
  }

  console.log(`\n正在更新版本号为: ${newVersion}\n`);

  filesToUpdate.forEach(filePath => {
    try {
      const data = readJson(filePath);
      const oldVersion = data.version;
      data.version = newVersion;
      writeJson(filePath, data);
      console.log(`  ✓ ${path.basename(filePath)}: ${oldVersion} → ${newVersion}`);
    } catch (error) {
      console.error(`  ✗ ${path.basename(filePath)}: 更新失败`);
      process.exit(1);
    }
  });

  console.log('\n✓ 版本号同步完成！');
}

// 主逻辑
const args = process.argv.slice(2);

if (args.length === 0) {
  // 无参数：显示当前版本号
  getCurrentVersions();
} else if (args.length === 1) {
  // 一个参数：更新版本号
  const newVersion = args[0];
  updateVersion(newVersion);
} else {
  console.log('用法:');
  console.log('  pnpm sync-version          # 查看当前版本号');
  console.log('  pnpm sync-version <版本>  # 更新版本号 (例如: 1.2.3)');
  process.exit(1);
}

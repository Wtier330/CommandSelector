export function getBatCommentTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  return `/**
 * @name
 * @shortDescription
 * @description
 * @category
 * @tags
 * @requires
 * @platform windows
 * @version 1.0.0
 * @author
 * @date ${today}
 *
 * @usage
 *
 * @example
 *
 */`;
}

export function getPs1CommentTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  return `<#
.SYNOPSIS

.SHORTDESCRIPTION

.DESCRIPTION

.CATEGORY

.TAGS

.REQUIRES

.PLATFORM Windows

.VERSION 1.0.0

.AUTHOR

.DATE ${today}

.USAGE

.EXAMPLE

.NOTES
#>`;
}

// VBS 注释模板 (使用 REM)
export function getVbsCommentTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  return `REM ============================================================
REM Script Name:
REM Description:
REM Category:
REM Tags:
REM Requires:
REM Platform: Windows
REM Version: 1.0.0
REM Author:
REM Date: ${today}
REM
REM Usage:
REM
REM Example:
REM
REM ============================================================

`;
}

// Shell 注释模板 (使用 #)
export function getShellCommentTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  return `#!/bin/bash
# ============================================================
# Script Name:
# Description:
# Category:
# Tags:
# Requires:
# Platform: Linux/Mac
# Version: 1.0.0
# Author:
# Date: ${today}
#
# Usage:
#
# Example:
#
# ============================================================

`;
}

// Python 注释模板 (使用 #)
export function getPythonCommentTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  return `"""
Script Metadata
-----------------
Description:
Category:
Tags:
Requires:
Platform: Any
Version: 1.0.0
Author:
Date: ${today}

Usage:

Example:

"""
# Python Script
`;
}

export function getBatCommentTemplateWithPlaceholder(metadata: {
  name?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const today = new Date().toISOString().split('T')[0];
  const tagsStr = (metadata?.tags || []).join(', ');
  const nameStr = metadata?.name || '';
  const shortDescStr = metadata?.shortDescription || '';
  const descStr = metadata?.description || '';
  const catStr = metadata?.category || '未分类';

  return `/**
 * @name ${nameStr}
 * @shortDescription ${shortDescStr}
 * @description ${descStr}
 * @category ${catStr}
 * @tags ${tagsStr}
 * @requires 管理员权限
 * @platform windows
 * @version 1.0.0
 * @author
 * @date ${today}
 *
 * @usage
 *
 * @example
 *
 */`;
}

export function getPs1CommentTemplateWithPlaceholder(metadata: {
  name?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const today = new Date().toISOString().split('T')[0];
  const tagsStr = (metadata?.tags || []).join(', ');
  const nameStr = metadata?.name || '';
  const shortDescStr = metadata?.shortDescription || '';
  const descStr = metadata?.description || '';
  const catStr = metadata?.category || '未分类';

  return `<#
.SYNOPSIS ${nameStr}

.SHORTDESCRIPTION ${shortDescStr}

.DESCRIPTION ${descStr}

.CATEGORY ${catStr}

.TAGS ${tagsStr}

.REQUIRES 管理员权限

.PLATFORM Windows

.VERSION 1.0.0

.AUTHOR

.DATE ${today}

.USAGE

.EXAMPLE

.NOTES
#>`;
}

// VBS 注释模板 with placeholder
export function getVbsCommentTemplateWithPlaceholder(metadata: {
  name?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const today = new Date().toISOString().split('T')[0];
  const tagsStr = (metadata?.tags || []).join(', ');
  const nameStr = metadata?.name || '';
  const descStr = metadata?.description || '';
  const catStr = metadata?.category || '未分类';

  return `REM ============================================================
REM Script Name: ${nameStr}
REM Description: ${descStr}
REM Category: ${catStr}
REM Tags: ${tagsStr}
REM Requires: 管理员权限
REM Platform: Windows
REM Version: 1.0.0
REM Author:
REM Date: ${today}
REM
REM Usage:
REM
REM Example:
REM
REM ============================================================

`;
}

// Shell 注释模板 with placeholder
export function getShellCommentTemplateWithPlaceholder(metadata: {
  name?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const today = new Date().toISOString().split('T')[0];
  const tagsStr = (metadata?.tags || []).join(', ');
  const nameStr = metadata?.name || '';
  const descStr = metadata?.description || '';
  const catStr = metadata?.category || '未分类';

  return `#!/bin/bash
# ============================================================
# Script Name: ${nameStr}
# Description: ${descStr}
# Category: ${catStr}
# Tags: ${tagsStr}
# Requires:
# Platform: Linux/Mac
# Version: 1.0.0
# Author:
# Date: ${today}
#
# Usage:
#
# Example:
#
# ============================================================

`;
}

// Python 注释模板 with placeholder
export function getPythonCommentTemplateWithPlaceholder(metadata: {
  name?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const today = new Date().toISOString().split('T')[0];
  const tagsStr = (metadata?.tags || []).join(', ');
  const descStr = metadata?.description || '';
  const catStr = metadata?.category || '未分类';

  return `"""
Script Metadata
-----------------
Description: ${descStr}
Category: ${catStr}
Tags: ${tagsStr}
Requires:
Platform: Any
Version: 1.0.0
Author:
Date: ${today}

Usage:

Example:

"""
# Python Script
`;
}

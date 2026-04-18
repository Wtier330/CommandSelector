export function getBatCommentTemplate(): string {
  const today = new Date().toISOString().split('T')[0];
  return `/**
 * @name
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

.DESCRIPTION

.CATEGORY

.TAGS

.REQUIRES

.PLATFORM
    Windows

.VERSION
    1.0.0

.AUTHOR

.DATE
    ${today}

.USAGE

.EXAMPLE

.NOTES
#>`;
}

export function getBatCommentTemplateWithPlaceholder(metadata: {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const today = new Date().toISOString().split('T')[0];
  const tagsStr = (metadata?.tags || []).join(', ');
  const nameStr = metadata?.name || '';
  const descStr = metadata?.description || '';
  const catStr = metadata?.category || '未分类';

  return `/**
 * @name ${nameStr}
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
  description?: string;
  category?: string;
  tags?: string[];
}): string {
  const today = new Date().toISOString().split('T')[0];
  const tagsStr = (metadata?.tags || []).join(', ');
  const nameStr = metadata?.name || '';
  const descStr = metadata?.description || '';
  const catStr = metadata?.category || '未分类';

  return `<#
.SYNOPSIS
    ${nameStr}

.DESCRIPTION
    ${descStr}

.CATEGORY
    ${catStr}

.TAGS
    ${tagsStr}

.REQUIRES
    管理员权限

.PLATFORM
    Windows

.VERSION
    1.0.0

.AUTHOR

.DATE
    ${today}

.USAGE

.EXAMPLE

.NOTES
#>`;
}

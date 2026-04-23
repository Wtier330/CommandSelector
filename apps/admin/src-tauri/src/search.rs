use rust_pinyin::get_pinyin;
use serde::{Deserialize, Serialize};

// ==================== 搜索相关数据结构 ====================

/// 命令条目（用于搜索，字段名与 TypeScript 端保持一致）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandEntry {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub engine: Option<String>,
    pub template: String,
    #[serde(rename = "powershellTemplate", skip_serializing_if = "Option::is_none", default)]
    pub powershell_template: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub params: Option<Vec<ParamDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub platform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub usage: Option<String>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none", default)]
    pub updated_at: Option<String>,
}

/// 参数定义（字段名与 TypeScript 端保持一致）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParamDefinition {
    pub key: String,
    pub label: String,
    #[serde(rename = "type")]
    pub param_type: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub default_value: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub hint: Option<String>,
}

/// 命令搜索请求
#[derive(Debug, Serialize, Deserialize)]
pub struct CommandSearchRequest {
    pub keyword: String,
    pub categories: Vec<String>,
    pub commands: Vec<CommandEntry>,
}

/// 命令搜索结果
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandSearchResult {
    pub filtered: Vec<CommandEntry>,
    pub match_count: usize,
}

/// 脚本文件元数据（字段名与 TypeScript 端保持一致）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptFileMeta {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub script_type: String,
    pub path: String,
    pub size: u64,
    #[serde(rename = "createdAt", default)]
    pub created_at: String,
    #[serde(rename = "updatedAt", default)]
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub metadata: Option<ParsedScriptMetadata>,
    #[serde(rename = "syncStatus", skip_serializing_if = "Option::is_none", default)]
    pub sync_status: Option<String>,
}

/// 解析的脚本元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedScriptMetadata {
    pub name: String,
    #[serde(rename = "shortDescription", skip_serializing_if = "Option::is_none", default)]
    pub short_description: Option<String>,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub requires: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub platform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub author: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub usage: Option<String>,
    pub params: Vec<ScriptParam>,
    pub examples: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub notes: Option<String>,
}

/// 脚本参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptParam {
    pub name: String,
    pub desc: String,
}

/// 脚本搜索请求
#[derive(Debug, Serialize, Deserialize)]
pub struct ScriptSearchRequest {
    pub keyword: String,
    pub scripts: Vec<ScriptFileMeta>,
}

/// 脚本搜索结果
#[derive(Debug, Serialize, Deserialize)]
pub struct ScriptSearchResult {
    pub filtered: Vec<ScriptFileMeta>,
    pub match_count: usize,
}

/// 拼音匹配结果
#[derive(Debug, Serialize, Deserialize)]
pub struct PinyinMatchResult {
    pub matched: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub matched_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub match_type: Option<String>,
}

// ==================== 搜索命令实现 ====================

/// 获取字符串的拼音首字母
fn get_pinyin_initials(s: &str) -> String {
    get_pinyin(s)
}

/// 拼音匹配文本与关键词
fn fuzzy_match_pinyin(text: &str, keyword: &str) -> PinyinMatchResult {
    if text.is_empty() || keyword.is_empty() {
        return PinyinMatchResult {
            matched: false,
            matched_text: None,
            match_type: None,
        };
    }

    let lower_text = text.to_lowercase();
    let lower_keyword = keyword.to_lowercase();

    if lower_text.contains(&lower_keyword) {
        return PinyinMatchResult {
            matched: true,
            matched_text: Some(text.to_string()),
            match_type: Some("exact".to_string()),
        };
    }

    let initials = get_pinyin_initials(text);
    let keyword_initials = get_pinyin_initials(keyword);

    if initials.contains(&keyword_initials) {
        return PinyinMatchResult {
            matched: true,
            matched_text: Some(initials.clone()),
            match_type: Some("initial".to_string()),
        };
    }

    let mut keyword_idx = 0;
    let keyword_chars: Vec<char> = keyword_initials.chars().collect();
    for char in initials.chars() {
        if keyword_idx < keyword_chars.len() && char == keyword_chars[keyword_idx] {
            keyword_idx += 1;
            if keyword_idx == keyword_chars.len() {
                return PinyinMatchResult {
                    matched: true,
                    matched_text: Some(initials),
                    match_type: Some("initial".to_string()),
                };
            }
        }
    }

    PinyinMatchResult {
        matched: false,
        matched_text: None,
        match_type: None,
    }
}

/// 搜索命令（支持拼音匹配）
#[tauri::command]
pub fn search_commands(request: CommandSearchRequest) -> Result<CommandSearchResult, String> {
    let CommandSearchRequest {
        keyword,
        categories,
        commands,
    } = request;

    let k = keyword.trim().to_lowercase();
    let is_all = categories.iter().any(|c| c == "__all__");
    let is_none = categories.iter().any(|c| c == "__none__");

    let filtered: Vec<CommandEntry> = commands
        .into_iter()
        .filter(|c| {
            if is_none {
                return false;
            }
            if !is_all {
                if let Some(ref cat) = c.category {
                    if !categories.contains(cat) {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            if k.is_empty() {
                return true;
            }

            // 构建搜索字段
            let hay = [
                c.name.as_str(),
                c.description.as_deref().unwrap_or(""),
                c.category.as_deref().unwrap_or(""),
                c.tags.as_deref().map(|t| t.join(" ")).unwrap_or_default().as_str(),
                c.engine.as_deref().unwrap_or(""),
                c.platform.as_deref().unwrap_or(""),
            ]
            .join(" ")
            .to_lowercase();

            // 1. 优先直接匹配
            if hay.contains(&k) {
                return true;
            }

            // 2. 拼音首字母匹配
            let initials = get_pinyin_initials(&hay);
            let keyword_initials = get_pinyin_initials(&k);
            if initials.contains(&keyword_initials) {
                return true;
            }

            // 3. 连续首字母匹配
            let keyword_chars: Vec<char> = keyword_initials.chars().collect();
            let mut keyword_idx = 0;
            for char in initials.chars() {
                if keyword_idx < keyword_chars.len() && char == keyword_chars[keyword_idx] {
                    keyword_idx += 1;
                    if keyword_idx == keyword_chars.len() {
                        return true;
                    }
                }
            }

            false
        })
        .collect();

    let match_count = filtered.len();
    Ok(CommandSearchResult {
        filtered,
        match_count,
    })
}

/// 搜索脚本（支持拼音匹配）
#[tauri::command]
pub fn search_scripts(request: ScriptSearchRequest) -> Result<ScriptSearchResult, String> {
    let ScriptSearchRequest { keyword, scripts } = request;

    let k = keyword.trim().to_lowercase();
    let script_count = scripts.len();

    if k.is_empty() {
        return Ok(ScriptSearchResult {
            filtered: scripts,
            match_count: script_count,
        });
    }

    let filtered: Vec<ScriptFileMeta> = scripts
        .into_iter()
        .filter(|s| {
            if s.name.to_lowercase().contains(&k) {
                return true;
            }

            if let Some(ref desc) = s.description {
                if desc.to_lowercase().contains(&k) {
                    return true;
                }
            }

            let initials_match = fuzzy_match_pinyin(&s.name, &k);
            if initials_match.matched {
                return true;
            }

            if let Some(ref metadata) = s.metadata {
                if metadata.name.to_lowercase().contains(&k)
                    || metadata.description.to_lowercase().contains(&k)
                    || metadata.category.to_lowercase().contains(&k)
                {
                    return true;
                }

                if metadata.tags.iter().any(|t| t.to_lowercase().contains(&k)) {
                    return true;
                }
            }

            false
        })
        .collect();

    let match_count = filtered.len();
    Ok(ScriptSearchResult {
        filtered,
        match_count,
    })
}

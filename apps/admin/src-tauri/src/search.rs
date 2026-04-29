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

// ==================== 搜索命令实现 ====================

/// 获取字符串的拼音首字母
fn get_pinyin_initials(s: &str) -> String {
    get_pinyin(s)
}

/// 对单个字段计算拼音匹配得分
/// 返回 0 表示不匹配，>0 表示匹配（值越大匹配度越高）
fn pinyin_match_score(text: &str, keyword: &str) -> i32 {
    if text.is_empty() || keyword.is_empty() {
        return 0;
    }

    let lower_text = text.to_lowercase();
    let lower_keyword = keyword.to_lowercase();

    // 直接文本匹配
    if lower_text.contains(&lower_keyword) {
        // 前缀匹配加分
        if lower_text.starts_with(&lower_keyword) {
            return 100;
        }
        return 80;
    }

    let initials = get_pinyin_initials(&lower_text);
    let keyword_initials = get_pinyin_initials(&lower_keyword);

    // 拼音首字母完全匹配（如 "qkhsz" 匹配 "qkhsz"）
    if initials == keyword_initials {
        return 70;
    }

    // 拼音首字母前缀匹配（如 "qkhsz" 匹配 "qk"）
    if initials.starts_with(&keyword_initials) {
        return 50;
    }

    // 拼音首字母包含匹配（如 "qkhsz" 包含 "hs"）
    if initials.contains(&keyword_initials) {
        return 30;
    }

    // 拼音首字母顺序子序列匹配（如 "qkhsz" 匹配 "qz" — 跳跃匹配，得分最低）
    let keyword_chars: Vec<char> = keyword_initials.chars().collect();
    let mut keyword_idx = 0;
    for char in initials.chars() {
        if keyword_idx < keyword_chars.len() && char == keyword_chars[keyword_idx] {
            keyword_idx += 1;
            if keyword_idx == keyword_chars.len() {
                return 15;
            }
        }
    }

    0
}

/// 计算命令的搜索得分（按字段分别匹配，避免跨字段拼接污染）
fn score_command(cmd: &CommandEntry, keyword: &str) -> i32 {
    let mut score = 0;

    // 名称匹配（权重最高）
    score = score.max(pinyin_match_score(&cmd.name, keyword) * 10);

    // 描述匹配
    if let Some(ref desc) = cmd.description {
        score = score.max(pinyin_match_score(desc, keyword) * 5);
    }

    // 标签匹配（按标签单独匹配，避免标签间拼接）
    if let Some(ref tags) = cmd.tags {
        for tag in tags {
            score = score.max(pinyin_match_score(tag, keyword) * 3);
        }
    }

    // 分类匹配
    if let Some(ref cat) = cmd.category {
        score = score.max(pinyin_match_score(cat, keyword) * 2);
    }

    // 引擎/平台匹配（权重最低）
    if let Some(ref engine) = cmd.engine {
        score = score.max(pinyin_match_score(engine, keyword));
    }
    if let Some(ref platform) = cmd.platform {
        score = score.max(pinyin_match_score(platform, keyword));
    }

    score
}

/// 搜索命令（支持拼音匹配，按字段分别匹配 + 评分排序）
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

    if is_none {
        return Ok(CommandSearchResult {
            filtered: vec![],
            match_count: 0,
        });
    }

    let k_ref = &k;

    let mut scored: Vec<(i32, CommandEntry)> = commands
        .into_iter()
        .filter(|c| {
            if !is_all {
                if let Some(ref cat) = c.category {
                    if !categories.contains(cat) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            true
        })
        .filter_map(|c| {
            if k_ref.is_empty() {
                return Some((0, c));
            }
            let score = score_command(&c, k_ref);
            if score > 0 {
                Some((score, c))
            } else {
                None
            }
        })
        .collect();

    // 按得分降序排序
    scored.sort_by(|a, b| b.0.cmp(&a.0));

    let filtered: Vec<CommandEntry> = scored.into_iter().map(|(_, c)| c).collect();
    let match_count = filtered.len();
    Ok(CommandSearchResult {
        filtered,
        match_count,
    })
}

/// 计算脚本的搜索得分（按字段分别匹配）
fn score_script(script: &ScriptFileMeta, keyword: &str) -> i32 {
    let mut score = 0;

    // 文件名匹配（权重最高）
    score = score.max(pinyin_match_score(&script.name, keyword) * 10);

    // 描述匹配
    if let Some(ref desc) = script.description {
        score = score.max(pinyin_match_score(desc, keyword) * 5);
    }

    // 元数据字段匹配
    if let Some(ref metadata) = script.metadata {
        // 脚本内部名称
        score = score.max(pinyin_match_score(&metadata.name, keyword) * 8);

        // 描述
        score = score.max(pinyin_match_score(&metadata.description, keyword) * 5);

        if let Some(ref short_desc) = metadata.short_description {
            score = score.max(pinyin_match_score(short_desc, keyword) * 6);
        }

        // 分类
        score = score.max(pinyin_match_score(&metadata.category, keyword) * 2);

        // 标签（按标签单独匹配）
        for tag in &metadata.tags {
            score = score.max(pinyin_match_score(tag, keyword) * 3);
        }
    }

    score
}

/// 搜索脚本（支持拼音匹配，按字段分别匹配 + 评分排序）
#[tauri::command]
pub fn search_scripts(request: ScriptSearchRequest) -> Result<ScriptSearchResult, String> {
    let ScriptSearchRequest { keyword, scripts } = request;

    let k = keyword.trim().to_lowercase();

    if k.is_empty() {
        let count = scripts.len();
        return Ok(ScriptSearchResult {
            filtered: scripts,
            match_count: count,
        });
    }

    let k_ref = &k;

    let mut scored: Vec<(i32, ScriptFileMeta)> = scripts
        .into_iter()
        .filter_map(|s| {
            let score = score_script(&s, k_ref);
            if score > 0 {
                Some((score, s))
            } else {
                None
            }
        })
        .collect();

    // 按得分降序排序
    scored.sort_by(|a, b| b.0.cmp(&a.0));

    let filtered: Vec<ScriptFileMeta> = scored.into_iter().map(|(_, s)| s).collect();
    let match_count = filtered.len();
    Ok(ScriptSearchResult {
        filtered,
        match_count,
    })
}

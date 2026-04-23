use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "ai_config.json";
const CONFIG_KEY: &str = "ai_config";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProviderConfig {
    pub id: String,
    pub name: String,
    pub provider: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub model: String,
    #[serde(rename = "customEndpoint")]
    pub custom_endpoint: Option<String>,
    pub temperature: Option<f32>,
    #[serde(rename = "maxTokens")]
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMultiConfig {
    pub providers: Vec<AIProviderConfig>,
    #[serde(rename = "defaultProviderId")]
    pub default_provider_id: Option<String>,
}

#[tauri::command]
pub async fn load_ai_config(app: AppHandle) -> Result<AIMultiConfig, String> {
    let store = app
        .store(STORE_PATH)
        .map_err(|e| format!("打开配置存储失败: {}", e))?;

    match store.get(CONFIG_KEY) {
        Some(value) => {
            serde_json::from_value(value.clone())
                .map_err(|e| format!("解析配置失败: {}", e))
        }
        None => Ok(AIMultiConfig {
            providers: vec![],
            default_provider_id: None,
        }),
    }
}

#[tauri::command]
pub async fn save_ai_config(app: AppHandle, config: AIMultiConfig) -> Result<(), String> {
    let store = app
        .store(STORE_PATH)
        .map_err(|e| format!("打开配置存储失败: {}", e))?;

    let json_value = serde_json::to_value(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    store.set(CONFIG_KEY, json_value);
    store.save()
        .map_err(|e| format!("保存配置失败: {}", e))?;

    Ok(())
}
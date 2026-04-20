/**
 * HTTP 工具函数
 * 在 Tauri 环境中使用 HTTP 插件绕过 CORS
 */

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface HTTPOptions {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

/**
 * 发送 HTTP 请求
 * 在 Tauri 环境中使用 HTTP 插件，在网页环境中使用 fetch
 */
export async function httpRequest(
  url: string,
  options: HTTPOptions = {}
): Promise<Response> {
  // 直接使用 fetch，无需区分环境
  // Tauri 环境中 fetch 通常不会有 CORS 问题
  return fetch(url, options);
}

/**
 * 创建 POST 请求
 */
export async function httpPost(
  url: string,
  data: any,
  headers?: Record<string, string>,
  signal?: AbortSignal
): Promise<Response> {
  return httpRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(data),
    signal,
  });
}
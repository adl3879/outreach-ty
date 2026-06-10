const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  method: string,
  url: string,
  data?: unknown
): Promise<{ data: T; error: string | null }> {
  const config: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (data) {
    config.body = JSON.stringify(data);
  }
  const res = await fetch(`${BASE_URL}/api${url}`, config);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? res.statusText);
  }
  return json;
}

const client = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, data?: unknown) => request<T>("POST", url, data),
  patch: <T>(url: string, data?: unknown) => request<T>("PATCH", url, data),
  put: <T>(url: string, data?: unknown) => request<T>("PUT", url, data),
  delete: <T>(url: string) => request<T>("DELETE", url),
};

export default client;

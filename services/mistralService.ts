import { Mistral } from '@mistralai/mistralai';

export interface MistralConfig {
  apiKey: string;
  model: string;
}

export const DEFAULT_MODEL = 'mistral-small-latest';

export function getStoredConfig(): MistralConfig {
  const stored = localStorage.getItem('mistral_api_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return { apiKey: '', model: DEFAULT_MODEL };
}

export async function sendChatMessage(
  systemPrompt: string, 
  userMessage?: string, 
  history: any[] = [],
  tools?: any[]
) {
  const config = getStoredConfig();
  const apiKey = config.apiKey || (import.meta as any).env.VITE_MISTRAL_API_KEY;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
      history,
      tools,
      apiKey,
      model: config.model
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `请求失败: ${response.status}`);
  }

  return await response.json();
}

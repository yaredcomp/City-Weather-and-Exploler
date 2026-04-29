export type LLMProvider = "ollama" | "openrouter" | "groq";

interface LLMConfig {
  provider: LLMProvider;
  model: string;
}

interface LLMResponse {
  content: string;
  error?: string;
}

function getLLMConfig(): LLMConfig {
  const provider = process.env.LLM_PROVIDER || "ollama";
  
  let model = "";
  
  switch (provider) {
    case "openrouter":
      model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";
      break;
    case "groq":
      model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
      break;
    case "ollama":
    default:
      model = process.env.OLLAMA_MODEL || "llama3.2";
      break;
  }
  
  return { provider: provider as LLMProvider, model };
}

async function callOllama(prompt: string, model: string): Promise<LLMResponse> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  
  const response = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    return { content: "", error: `Ollama error: ${response.status} - ${errorText}` };
  }
  
  const data = await response.json();
  return { content: data.response || "" };
}

async function callOpenRouter(prompt: string, model: string): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return { content: "", error: "OPENROUTER_API_KEY not configured" };
  }
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { content: "", error: `OpenRouter error: ${response.status} - ${JSON.stringify(errorData)}` };
  }
  
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content || "" };
}

async function callGroq(prompt: string, model: string): Promise<LLMResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return { content: "", error: "GROQ_API_KEY not configured" };
  }
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { content: "", error: `Groq error: ${response.status} - ${JSON.stringify(errorData)}` };
  }
  
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content || "" };
}

export async function callLLM(prompt: string): Promise<LLMResponse> {
  const config = getLLMConfig();
  
  switch (config.provider) {
    case "openrouter":
      return callOpenRouter(prompt, config.model);
    case "groq":
      return callGroq(prompt, config.model);
    case "ollama":
    default:
      return callOllama(prompt, config.model);
  }
}

export function getProviderName(): string {
  const config = getLLMConfig();
  const names: Record<LLMProvider, string> = {
    ollama: "Ollama (Local)",
    openrouter: "OpenRouter",
    groq: "Groq",
  };
  return names[config.provider];
}

import { getProviderName, callLLM } from "./llm";

describe("LLM Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getProviderName", () => {
    it("should return 'Ollama (Local)' as default provider", () => {
      delete process.env.LLM_PROVIDER;

      const name = getProviderName();

      expect(name).toBe("Ollama (Local)");
    });

    it("should return 'OpenRouter' when provider is openrouter", () => {
      process.env.LLM_PROVIDER = "openrouter";

      const name = getProviderName();

      expect(name).toBe("OpenRouter");
    });

    it("should return 'Groq' when provider is groq", () => {
      process.env.LLM_PROVIDER = "groq";

      const name = getProviderName();

      expect(name).toBe("Groq");
    });
  });

  describe("callLLM", () => {
    it("should return error when API key is missing for OpenRouter", async () => {
      process.env.LLM_PROVIDER = "openrouter";
      delete process.env.OPENROUTER_API_KEY;

      const result = await callLLM("test prompt");

      expect(result.error).toBe("OPENROUTER_API_KEY not configured");
    });

    it("should return error when API key is missing for Groq", async () => {
      process.env.LLM_PROVIDER = "groq";
      delete process.env.GROQ_API_KEY;

      const result = await callLLM("test prompt");

      expect(result.error).toBe("GROQ_API_KEY not configured");
    });
  });
});

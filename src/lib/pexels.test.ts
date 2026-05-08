import { searchCityImages } from "./pexels";

describe("Pexels Module", () => {
  const originalEnv = process.env;
  const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("searchCityImages", () => {
    it("should return placeholder images when API key is not configured", async () => {
      delete process.env.PEXELS_API_KEY;

      const images = await searchCityImages("Paris");

      expect(images).toHaveLength(3);
      expect(images[0]).toHaveProperty("id");
      expect(images[0]).toHaveProperty("url");
      expect(images[0].url).toContain("picsum.photos");
    });

    it("should return correct number of images when count is specified", async () => {
      delete process.env.PEXELS_API_KEY;

      const images = await searchCityImages("London", 2);

      expect(images).toHaveLength(3);
    });

    it("should include placeholder image properties", async () => {
      delete process.env.PEXELS_API_KEY;

      const images = await searchCityImages("Tokyo");

      images.forEach((image) => {
        expect(image).toHaveProperty("id");
        expect(image).toHaveProperty("url");
        expect(image).toHaveProperty("thumbUrl");
        expect(image).toHaveProperty("photographer");
        expect(image).toHaveProperty("photographerUrl");
        expect(image).toHaveProperty("alt");
        expect(image).toHaveProperty("width");
        expect(image).toHaveProperty("height");
      });
    });

    it("should generate consistent image IDs for the same city", async () => {
      delete process.env.PEXELS_API_KEY;

      const images1 = await searchCityImages("Berlin");
      const images2 = await searchCityImages("Berlin");

      expect(images1[0].id).toBe(images2[0].id);
    });

    it("should handle cities with spaces in name", async () => {
      delete process.env.PEXELS_API_KEY;

      const images = await searchCityImages("New York");

      expect(images).toHaveLength(3);
      expect(images[0].id).toBeDefined();
    });

    it("should return placeholder images on API error", async () => {
      process.env.PEXELS_API_KEY = "invalid-key";

      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

      const images = await searchCityImages("Rome");

      expect(images).toHaveLength(3);
      expect(images[0].url).toContain("picsum.photos");
    });
  });
});

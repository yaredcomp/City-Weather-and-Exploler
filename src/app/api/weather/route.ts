import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";
import { searchCityImages } from "@/lib/pexels";

interface WorkflowResult {
  step: string;
  content: string;
}

interface GeoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  population?: number;
}

interface GeocodingResponse {
  results?: GeoLocation[];
}

interface WikipediaPage {
  extract?: string;
  pageid?: number;
  title?: string;
}

interface WikipediaResponse {
  query?: {
    pages?: {
      [key: string]: WikipediaPage;
    };
  };
}

async function geocodeCity(cityName: string): Promise<{ geo: GeoLocation | null; suggestions?: string[] }> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=en&format=json`
    );
    const data = (await response.json()) as GeocodingResponse;

    if (data.results && data.results.length > 0) {
      return { geo: data.results[0] };
    }

    const cleanName = cityName.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const words = cleanName.split(/\s+/);

    const suggestionResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(words[0] || cityName)}&count=5&language=en&format=json`
    );
    const suggestionData = (await suggestionResponse.json()) as GeocodingResponse;

    const suggestions = suggestionData.results
      ? suggestionData.results
          .filter((r) => {
            const rName = r.name.toLowerCase();
            return words.some((w) => rName.includes(w) || LevenshteinDistance(w, rName) <= 2);
          })
          .slice(0, 3)
          .map((r) => `${r.name}, ${r.country}`)
      : [];

    return { geo: null, suggestions };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { geo: null };
  }
}

function LevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

async function getWeather(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`
    );
    const data = await response.json();

    const current = data.current;
    const weatherDescriptions: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };

    const description = weatherDescriptions[current.weather_code] || "Unknown";

    return JSON.stringify({
      temperature: `${current.temperature_2m}°C`,
      feelsLike: `${current.apparent_temperature}°C`,
      humidity: `${current.relative_humidity_2m}%`,
      windSpeed: `${current.wind_speed_10m} km/h`,
      windDirection: `${current.wind_direction_10m}°`,
      condition: description,
      icon: getWeatherIcon(current.weather_code),
    });
  } catch (error) {
    console.error("Weather error:", error);
    return JSON.stringify({
      temperature: "N/A",
      feelsLike: "N/A",
      humidity: "N/A",
      windSpeed: "N/A",
      windDirection: "N/A",
      condition: "Unable to fetch weather data",
      icon: "cloud",
    });
  }
}

function getWeatherIcon(code: number): string {
  if (code === 0) return "sun";
  if (code <= 3) return "cloud-sun";
  if (code <= 48) return "cloud-fog";
  if (code <= 55) return "cloud-drizzle";
  if (code <= 65) return "cloud-rain";
  if (code <= 77) return "cloud-snow";
  if (code <= 82) return "cloud-rain-wind";
  if (code <= 86) return "cloud-snow";
  return "cloud-lightning";
}

function extractCityIntro(cityName: string, extract: string, title: string): { intro: string; full: string; title: string } {
  const disambiguationPatterns = [
    /may also refer to:/i,
    /most commonly refers to:/i,
    /can (?:also |)refer to:/i,
    /is (?:a |)[^.]*(?:state|city|town|county|borough|province|region|area|place)/i,
    /\(disambiguation\)/i,
  ];

  let introEnd = extract.length;

  for (const pattern of disambiguationPatterns) {
    const match = extract.search(pattern);
    if (match !== -1 && match < introEnd) {
      introEnd = match;
    }
  }

  let intro = extract.substring(0, introEnd).trim();

  const sentences = intro.split(/(?<=[.!?])\s+/);
  if (sentences.length > 2) {
    intro = sentences.slice(0, 2).join(" ").trim();
  }

  if (intro.length < 50) {
    intro = extract.substring(0, 300).trim() + (extract.length > 300 ? "..." : "");
  }

  return {
    intro,
    full: extract,
    title,
  };
}

async function getWikipediaInfo(cityName: string, country?: string): Promise<{ intro: string; full: string; title: string; wikiUrl: string }> {
  try {
    const searchTitle = country ? `${cityName}, ${country}` : cityName;
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(searchTitle)}&redirects=1`
    );
    const data = (await response.json()) as WikipediaResponse;

    const pages = data.query?.pages;
    if (!pages) {
      return { intro: `No Wikipedia information found for ${cityName}`, full: "", title: cityName, wikiUrl: "" };
    }

    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (pageId === "-1" || !page.extract) {
      const fallbackResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(cityName)}&redirects=1`
      );
      const fallbackData = (await fallbackResponse.json()) as WikipediaResponse;
      const fallbackPages = fallbackData.query?.pages;

      if (fallbackPages) {
        const fallbackPageId = Object.keys(fallbackPages)[0];
        const fallbackPage = fallbackPages[fallbackPageId];
        if (fallbackPage && fallbackPage.extract) {
          const result = extractCityIntro(cityName, fallbackPage.extract, fallbackPage.title || cityName);
          return { ...result, wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(fallbackPage.title || cityName)}` };
        }
      }
      return { intro: `No Wikipedia information found for ${cityName}`, full: "", title: cityName, wikiUrl: "" };
    }

    const result = extractCityIntro(cityName, page.extract, page.title || cityName);
    const wikiUrl = page.title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}` : "";
    return { ...result, wikiUrl };
  } catch (error) {
    console.error("Wikipedia error:", error);
    return { intro: `Wikipedia information unavailable for ${cityName}`, full: "", title: cityName, wikiUrl: "" };
  }
}

async function getCityInsights(
  cityName: string,
  country: string,
  population?: number
): Promise<string> {
  const prompt = `You are a knowledgeable local guide providing comprehensive travel and business information about ${cityName}, ${country}${population ? ` (population: ~${population.toLocaleString()})` : ""}.

Write exactly these 6 sections with no extra preamble or explanation:

## History & Foundation
[2-3 sentences about founding, key historical events, or notable dates]

## Famous Landmarks
[3-4 must-see landmarks or attractions with brief one-sentence descriptions]

## Local Culture & Cuisine
[2-3 sentences about local food, traditions, customs, or cultural tips]

## For Business Travelers
[2 items: key industries, business districts, transport tips, or coworking suggestions]

## For Vacationers
[2 items: best areas to stay, hidden gems, best time to visit, or local tips]

## City Highlights & Famous Faces
[3 items: what the city is best known for, notable famous people born there, or unique fun facts]`;

  const result = await callLLM(prompt);

  if (result.error) {
    return `Unable to generate city insights: ${result.error}`;
  }

  let content = result.content || "City insights unavailable";

  content = content.replace(/^[\s\n]*Okay[,:]?\s*/i, "");
  content = content.replace(/^[\s\n]*Sure[,:]?\s*/i, "");
  content = content.replace(/^[\s\n]*Here(?:'s|s)?[\s,]*/i, "");
  content = content.replace(/^[\s\n]*Certainly[,:]?\s*/i, "");
  content = content.replace(/^[\s\n]*As (?:a|an)[^,\n]*(?:,|-)/i, "");
  content = content.replace(/^[\s\n]*(?:in the exact format you requested|:|\.|\*)/i, "");
  content = content.replace(/^[\s\n]*(?:here'?s? )?(?:the )?(?:information|guide|details)(?: you requested)?[.:\s]*/i, "");

  return content.trim();
}

export async function POST(req: NextRequest) {
  const { location } = await req.json();

  if (!location || typeof location !== "string") {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  const results: WorkflowResult[] = [];

  try {
    const geoResult = await geocodeCity(location);

    if (!geoResult.geo) {
      const errorMsg = geoResult.suggestions && geoResult.suggestions.length > 0
        ? `Could not find "${location}". Did you mean: ${geoResult.suggestions.join(", ")}?`
        : `Could not find location: ${location}. Please check the spelling and try again.`;
      return NextResponse.json({ error: errorMsg }, { status: 404 });
    }

    const geoData = geoResult.geo;
    const cityName = geoData.name;
    const country = geoData.country;
    const { latitude: lat, longitude: lon, population } = geoData;

    const [weatherData, wikiInfo, cityImages, cityInsights] = await Promise.all([
      getWeather(lat, lon),
      getWikipediaInfo(cityName, country),
      searchCityImages(cityName, 4),
      getCityInsights(cityName, country, population),
    ]);

    results.push({
      step: "1",
      content: JSON.stringify({
        city: cityName,
        country,
        population: population || "Unknown",
        latitude: lat,
        longitude: lon,
      }),
    });

    results.push({
      step: "2",
      content: weatherData,
    });

    results.push({
      step: "3",
      content: JSON.stringify({
        title: wikiInfo.title,
        intro: wikiInfo.intro,
        wikiUrl: wikiInfo.wikiUrl,
      }),
    });

    results.push({
      step: "4",
      content: cityInsights,
    });

    results.push({
      step: "5",
      content: JSON.stringify(cityImages),
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred while fetching city information" }, { status: 500 });
  }
}

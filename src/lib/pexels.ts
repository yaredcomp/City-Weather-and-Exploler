export interface CityImage {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
  width: number;
  height: number;
}

interface PexelsSearchResult {
  total_results: number;
  page: number;
  per_page: number;
  photos: Array<{
    id: number;
    src: {
      original: string;
      large2x: string;
      large: string;
      medium: string;
      small: string;
      portrait: string;
      landscape: string;
      tiny: string;
    };
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    alt: string;
    width: number;
    height: number;
  }>;
}

export async function searchCityImages(
  city: string,
  count: number = 4
): Promise<CityImage[]> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn("PEXELS_API_KEY not configured - returning placeholder images");
    return getPlaceholderImages(city);
  }

  try {
    const query = encodeURIComponent(`${city} famous landmark city`);
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`Pexels API error: ${response.status}`);
      return getPlaceholderImages(city);
    }

    const data = (await response.json()) as PexelsSearchResult;

    return data.photos.map((photo) => ({
      id: photo.id.toString(),
      url: photo.src.large,
      thumbUrl: photo.src.medium,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt || `${city} landmark`,
      width: photo.width,
      height: photo.height,
    }));
  } catch (error) {
    console.error("Pexels fetch error:", error);
    return getPlaceholderImages(city);
  }
}

function getPlaceholderImages(city: string): CityImage[] {
  const seed = city.toLowerCase().replace(/\s+/g, "-");
  return [
    {
      id: `placeholder-1-${seed}`,
      url: `https://picsum.photos/seed/${seed}/800/600`,
      thumbUrl: `https://picsum.photos/seed/${seed}/200/150`,
      photographer: "Picsum",
      photographerUrl: "https://picsum.photos",
      alt: `${city} cityscape`,
      width: 800,
      height: 600,
    },
    {
      id: `placeholder-2-${seed}`,
      url: `https://picsum.photos/seed/${seed}-2/800/600`,
      thumbUrl: `https://picsum.photos/seed/${seed}-2/200/150`,
      photographer: "Picsum",
      photographerUrl: "https://picsum.photos",
      alt: `${city} architecture`,
      width: 800,
      height: 600,
    },
    {
      id: `placeholder-3-${seed}`,
      url: `https://picsum.photos/seed/${seed}-3/800/600`,
      thumbUrl: `https://picsum.photos/seed/${seed}-3/200/150`,
      photographer: "Picsum",
      photographerUrl: "https://picsum.photos",
      alt: `${city} skyline`,
      width: 800,
      height: 600,
    },
  ];
}
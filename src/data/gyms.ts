// Gym listings come from OpenStreetMap through the free Overpass API, so the
// app needs no paid data or API key. Coverage is good in cities and thinner
// in rural areas.

export type Gym = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceMiles: number;
  address?: string;
  hours?: string;
  open24h: boolean;
  phone?: string;
  website?: string;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS_URLS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

export const SEARCH_RADIUS_MILES = 25;
const METERS_PER_MILE = 1609.34;

// Results from the last search, so the detail screen can show a gym by id.
const recentGyms = new Map<string, Gym>();

export function getGym(id: string): Gym | undefined {
  return recentGyms.get(id);
}

export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatAddress(tags: Record<string, string>): string | undefined {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const parts = [street, tags['addr:city'], tags['addr:state']].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function parseGyms(elements: OverpassElement[], fromLat: number, fromLon: number): Gym[] {
  const gyms: Gym[] = [];
  for (const element of elements) {
    const tags = element.tags ?? {};
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    // Unnamed entries are usually rooms inside another building; skip them.
    if (lat === undefined || lon === undefined || !tags.name) continue;
    gyms.push({
      id: `${element.type}-${element.id}`,
      name: tags.name,
      lat,
      lon,
      distanceMiles: distanceMiles(fromLat, fromLon, lat, lon),
      address: formatAddress(tags),
      hours: tags.opening_hours,
      open24h: tags.opening_hours === '24/7',
      phone: tags.phone ?? tags['contact:phone'],
      website: tags.website ?? tags['contact:website'],
    });
  }
  return gyms.sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export async function findGymsNear(lat: number, lon: number): Promise<Gym[]> {
  const radius = Math.round(SEARCH_RADIUS_MILES * METERS_PER_MILE);
  const query = `[out:json][timeout:25];nwr["leisure"="fitness_centre"](around:${radius},${lat},${lon});out center tags 60;`;

  let lastError: unknown;
  for (const url of OVERPASS_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) throw new Error(`Gym search failed (${response.status})`);
      const json = (await response.json()) as { elements: OverpassElement[] };
      const gyms = parseGyms(json.elements, lat, lon);
      recentGyms.clear();
      gyms.forEach((gym) => recentGyms.set(gym.id, gym));
      return gyms;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

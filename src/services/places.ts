import { MOCK_PLACES } from '../data/mockPlaces';
import { getLang } from '../i18n';
import { Place } from '../types';

// Si existe EXPO_PUBLIC_GOOGLE_PLACES_KEY se usa Google Places (API New).
// Si no, se busca en los restaurantes de prueba.
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

export const usingGoogle = !!GOOGLE_KEY;

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const PRICE: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const CUISINE_EMOJI: [RegExp, string][] = [
  [/japon|sushi|ramen/, '🍣'],
  [/ital|pizz/, '🍕'],
  [/mexic|mexik/, '🌮'],
  [/hamburg|hanburg|burger/, '🍔'],
  [/marisc|pesca|seafood|itsaski|arrain/, '🦐'],
  [/asador|carne|steak|parrilla|erretegi|haragi/, '🥩'],
  [/china|chino|txina/, '🥟'],
  [/indi/, '🍛'],
  [/vegeta|vegan|begetar|began/, '🥗'],
  [/tapas|tapak|pintxo|taberna|\bbar\b/, '🍤'],
];

function emojiFor(cuisine: string) {
  const c = normalize(cuisine);
  return CUISINE_EMOJI.find(([re]) => re.test(c))?.[1] ?? '🍽️';
}

async function searchGoogle(query: string): Promise<Place[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY!,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.primaryTypeDisplayName,places.addressComponents',
    },
    body: JSON.stringify({ textQuery: query, includedType: 'restaurant', languageCode: getLang(), pageSize: 15 }),
  });
  if (!res.ok) throw new Error(`Google Places respondió ${res.status}`);
  const json = await res.json();
  return (json.places ?? []).map((p: any): Place => {
    const comps: any[] = p.addressComponents ?? [];
    const area =
      comps.find((c) => c.types?.includes('neighborhood'))?.longText ??
      comps.find((c) => c.types?.includes('sublocality'))?.longText ??
      comps.find((c) => c.types?.includes('locality'))?.longText ??
      'Sin zona';
    // "Restaurante italiano" -> "italiano"; en euskera "Tapas-jatetxea" -> "Tapas"
    const cuisine = (p.primaryTypeDisplayName?.text ?? 'Restaurante')
      .replace(/^(Restaurante|Especializado en)\s+/i, '')
      .replace(/[-\s]jatetxea$/i, '');
    const cap = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
    return {
      id: p.id,
      name: p.displayName?.text ?? 'Sin nombre',
      address: p.formattedAddress ?? '',
      area,
      cuisine: cap,
      rating: p.rating,
      priceLevel: PRICE[p.priceLevel],
      emoji: emojiFor(cap),
    };
  });
}

// Palabras que la gente busca y que no salen en el tipo de cocina.
const MOCK_TAGS: Record<string, string> = {
  Pizzería: 'pizza italiana',
  Italiana: 'pasta pizza',
  Japonesa: 'sushi ramen asiatica',
  China: 'asiatica dumplings',
  Tailandesa: 'asiatica curry',
  Hamburguesas: 'burger hamburguesa',
  Marisquería: 'marisco pescado',
  Asador: 'carne brasa parrilla pollo',
  Mexicana: 'tacos burritos',
  India: 'curry',
  Tapas: 'bar raciones croquetas',
  Vegetariana: 'vegano veggie',
  Peruana: 'ceviche',
  Española: 'arroz paella cocido',
  Francesa: 'brunch',
  Turca: 'kebab',
};

export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (GOOGLE_KEY) return searchGoogle(q);
  await new Promise((r) => setTimeout(r, 250)); // simula la red
  const words = normalize(q).split(/\s+/);
  return MOCK_PLACES.filter((p) => {
    const haystack = normalize([p.name, p.area, p.cuisine, p.address, MOCK_TAGS[p.cuisine] ?? ''].join(' '));
    return words.every((w) => haystack.includes(w));
  });
}

import { Place } from '../types';

// Restaurantes ficticios que imitan los resultados de Google Places
// mientras no haya una clave de API configurada.
const raw: [string, string, string, string, number, number, string][] = [
  ['La Tasquita de Lola', 'Calle del Pez 14', 'Malasaña', 'Tapas', 4.6, 2, '🍤'],
  ['Trattoria Nonna Pina', 'Calle de San Bernardo 52', 'Malasaña', 'Italiana', 4.4, 2, '🍝'],
  ['Sushi Kaze', 'Calle de Fuencarral 120', 'Chamberí', 'Japonesa', 4.7, 3, '🍣'],
  ['El Asador de Tomás', 'Calle de Ponzano 33', 'Chamberí', 'Asador', 4.5, 3, '🥩'],
  ['Taquería La Güera', 'Calle de Argumosa 8', 'Lavapiés', 'Mexicana', 4.3, 1, '🌮'],
  ['Masala House', 'Calle de Lavapiés 21', 'Lavapiés', 'India', 4.5, 1, '🍛'],
  ['Casa Remedios', 'Cava Baja 17', 'La Latina', 'Española', 4.6, 2, '🥘'],
  ['Bodega El Arco', 'Calle de la Cava Alta 5', 'La Latina', 'Tapas', 4.2, 2, '🍷'],
  ['Marisquería O Porto', 'Calle de Goya 40', 'Salamanca', 'Marisquería', 4.4, 4, '🦞'],
  ['Burger Barrio', 'Calle de Velázquez 80', 'Salamanca', 'Hamburguesas', 4.1, 2, '🍔'],
  ['Pizzería Vesubio', 'Calle de Toledo 66', 'La Latina', 'Pizzería', 4.5, 1, '🍕'],
  ['Verde Huerta', 'Calle de Santa Isabel 9', 'Lavapiés', 'Vegetariana', 4.4, 2, '🥗'],
  ['Inti Ceviches', 'Calle de Hortaleza 70', 'Chueca', 'Peruana', 4.6, 2, '🐟'],
  ['Ramen Hoshi', 'Calle de Augusto Figueroa 12', 'Chueca', 'Japonesa', 4.3, 2, '🍜'],
  ['Mesón Los Arcos', 'Plaza Mayor 3', 'Centro', 'Española', 3.9, 2, '🍳'],
  ['La Piadina di Marco', 'Calle de Atocha 44', 'Centro', 'Italiana', 4.2, 1, '🥙'],
  ['Brasa y Leña', 'Calle de Serrano 110', 'Salamanca', 'Asador', 4.7, 4, '🔥'],
  ['Dim Sum Garden', 'Calle de Leganitos 20', 'Centro', 'China', 4.4, 1, '🥟'],
  ['Pollos El Gallo', 'Calle de Embajadores 90', 'Lavapiés', 'Asador', 4.0, 1, '🍗'],
  ['Bar Pepe Croquetas', 'Calle de Trafalgar 11', 'Chamberí', 'Tapas', 4.5, 1, '🧆'],
  ['Thai Orchid', 'Calle de Pelayo 15', 'Chueca', 'Tailandesa', 4.3, 2, '🍲'],
  ['La Burguesía', 'Calle de la Palma 28', 'Malasaña', 'Hamburguesas', 4.4, 2, '🍔'],
  ['Arrocería La Marina', 'Calle de Jorge Juan 30', 'Salamanca', 'Española', 4.5, 3, '🥘'],
  ['Pizzeria Forno Rosso', 'Calle de Santa Engracia 60', 'Chamberí', 'Pizzería', 4.6, 2, '🍕'],
  ['Cantina Frida', 'Calle de Manuela Malasaña 6', 'Malasaña', 'Mexicana', 4.2, 2, '🌯'],
  ['Izakaya Tora', 'Calle de San Andrés 18', 'Malasaña', 'Japonesa', 4.5, 3, '🍶'],
  ['Taberna El Sur', 'Calle de la Torrecilla del Leal 12', 'Lavapiés', 'Tapas', 4.3, 1, '🫒'],
  ['Le Petit Bistró', 'Calle de Almagro 22', 'Chamberí', 'Francesa', 4.4, 3, '🥐'],
  ['Mar de Cádiz', 'Calle de Barquillo 35', 'Chueca', 'Marisquería', 4.3, 3, '🦐'],
  ['Kebab Anatolia', 'Calle de Mesón de Paredes 40', 'Lavapiés', 'Turca', 4.1, 1, '🥙'],
];

export const MOCK_PLACES: Place[] = raw.map(([name, street, area, cuisine, rating, priceLevel, emoji], i) => ({
  id: `mock_${i + 1}`,
  name,
  address: `${street}, ${area}, Madrid`,
  area,
  cuisine,
  rating,
  priceLevel,
  emoji,
}));

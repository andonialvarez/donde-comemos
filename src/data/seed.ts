import { AppState, Entry, Place } from '../types';
import { MOCK_PLACES } from './mockPlaces';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const p = (n: number): Place => MOCK_PLACES[n - 1];

let n = 0;
const entry = (
  place: Place,
  addedBy: string,
  score: number,
  pros: string,
  cons: string,
  recommendation: string,
  daysAgo: number,
  votes?: string[],
): Entry => ({
  id: `seed_e${++n}`,
  place,
  addedBy,
  score,
  pros,
  cons,
  recommendation,
  createdAt: now - daysAgo * DAY,
  votes,
});

export const SEED_VERSION = 1;

export function createSeed(): AppState {
  n = 0;
  return {
    version: SEED_VERSION,
    meId: 'u_me',
    users: [
      { id: 'u_me', name: 'Andoni', avatar: '🧑‍🍳', color: '#E8572A' },
      { id: 'u_lucia', name: 'Lucía', avatar: '👩', color: '#7C5CFA' },
      { id: 'u_marcos', name: 'Marcos', avatar: '🧔', color: '#1F9D8B' },
      { id: 'u_irene', name: 'Irene', avatar: '👩‍🦰', color: '#D6336C' },
      { id: 'u_pablo', name: 'Pablo', avatar: '👨‍🦱', color: '#2F7DD1' },
    ],
    lists: [
      {
        id: 'seed_l1',
        ownerId: 'u_me',
        title: 'Mis imprescindibles',
        description: 'Los sitios a los que siempre vuelvo.',
        emoji: '⭐',
        isPublic: true,
        likes: ['u_lucia', 'u_marcos'],
        createdAt: now - 40 * DAY,
        entries: [
          entry(p(7), 'u_me', 5, 'Los huevos rotos son de otro nivel.', 'Hay que reservar con mucha antelación.', 'Pide los huevos rotos con jamón y el rabo de toro.', 30),
          entry(p(3), 'u_me', 5, 'Pescado fresquísimo y el chef es un crack.', 'Un poco caro.', 'Menú omakase si vais a celebrar algo.', 20),
          entry(p(20), 'u_me', 4, 'Croquetas cremosas, barra con ambiente.', 'Se llena y no hay mesas.', 'Croquetas de jamón y de boletus.', 10),
        ],
      },
      {
        id: 'seed_l2',
        ownerId: 'u_me',
        title: 'Pendientes de probar',
        description: 'Me los han recomendado.',
        emoji: '📝',
        isPublic: false,
        likes: [],
        createdAt: now - 5 * DAY,
        entries: [entry(p(13), 'u_me', 0, '', '', 'Me lo recomendó Lucía.', 5)],
      },
      {
        id: 'seed_l3',
        ownerId: 'u_lucia',
        title: 'Cenas baratas que no fallan',
        description: 'Menos de 20 € por cabeza y sales feliz.',
        emoji: '💸',
        isPublic: true,
        likes: ['u_me', 'u_marcos', 'u_irene', 'u_pablo'],
        createdAt: now - 25 * DAY,
        entries: [
          entry(p(5), 'u_lucia', 5, 'Tacos al pastor de verdad.', 'Mesas pequeñas.', 'Tacos al pastor y de cochinita.', 24),
          entry(p(11), 'u_lucia', 5, 'Masa napolitana perfecta.', 'No reservan.', 'La diavola.', 18),
          entry(p(6), 'u_lucia', 4, 'Raciones enormes.', 'El local es ruidoso.', 'Butter chicken y naan de ajo.', 12),
        ],
      },
      {
        id: 'seed_l4',
        ownerId: 'u_marcos',
        title: 'Carne, carne y más carne',
        description: 'Para días sin dieta.',
        emoji: '🥩',
        isPublic: true,
        likes: ['u_pablo'],
        createdAt: now - 15 * DAY,
        entries: [
          entry(p(4), 'u_marcos', 5, 'Chuletón en su punto.', 'Precio alto.', 'Chuletón para dos.', 14),
          entry(p(17), 'u_marcos', 4, 'Sitio precioso.', 'Servicio lento.', 'La presa ibérica.', 9),
          entry(p(10), 'u_marcos', 4, 'Burger jugosa.', 'Patatas normalitas.', 'La smash doble.', 3),
        ],
      },
      {
        id: 'seed_l5',
        ownerId: 'u_irene',
        title: 'Brunch y cosas ricas',
        description: 'Finde tranquilo.',
        emoji: '🥐',
        isPublic: true,
        likes: ['u_lucia'],
        createdAt: now - 8 * DAY,
        entries: [
          entry(p(28), 'u_irene', 5, 'Croissants caseros.', 'Cola los domingos.', 'Huevos benedict.', 7),
          entry(p(12), 'u_irene', 4, 'Todo vegetal y muy rico.', 'Raciones justas.', 'Bowl de temporada.', 4),
        ],
      },
    ],
    groups: [
      {
        id: 'seed_g1',
        name: 'Cenas de los viernes',
        emoji: '🍻',
        inviteCode: 'VIERNES',
        memberIds: ['u_me', 'u_lucia', 'u_marcos', 'u_irene'],
        createdAt: now - 30 * DAY,
        entries: [
          entry(p(26), 'u_lucia', 0, '', '', 'Dicen que el karaage es brutal.', 6, ['u_lucia', 'u_me']),
          entry(p(23), 'u_marcos', 4, 'Arroz meloso de bogavante top.', 'Hay que pedir para mínimo 2.', 'Arroz de bogavante.', 15, ['u_marcos', 'u_irene', 'u_me']),
          entry(p(21), 'u_irene', 0, '', '', 'Nunca hemos ido a un tailandés juntos.', 2, ['u_irene']),
        ],
        comments: [
          { id: 'seed_c1', userId: 'u_lucia', text: '¿Este viernes probamos el Izakaya?', createdAt: now - 1 * DAY },
          { id: 'seed_c2', userId: 'u_marcos', text: 'Yo prefiero arroz, que hace frío 😅', createdAt: now - 0.9 * DAY },
          { id: 'seed_c3', userId: 'u_irene', text: 'He creado una votación para decidirlo.', createdAt: now - 0.8 * DAY },
        ],
        polls: [
          {
            id: 'seed_p1',
            question: '¿Dónde cenamos este viernes?',
            createdBy: 'u_irene',
            createdAt: now - 0.8 * DAY,
            closed: false,
            options: [
              { id: 'o1', text: 'Izakaya Tora', votes: ['u_lucia'] },
              { id: 'o2', text: 'Arrocería La Marina', votes: ['u_marcos', 'u_irene'] },
              { id: 'o3', text: 'Thai Orchid', votes: [] },
            ],
          },
          {
            id: 'seed_p2',
            question: '¿A qué hora quedamos?',
            createdBy: 'u_marcos',
            createdAt: now - 0.7 * DAY,
            closed: false,
            options: [
              { id: 'o1', text: '21:00', votes: ['u_marcos'] },
              { id: 'o2', text: '21:30', votes: ['u_lucia', 'u_irene'] },
            ],
          },
        ],
      },
      {
        id: 'seed_g2',
        name: 'Brunch de domingo',
        emoji: '🥞',
        inviteCode: 'BRUNCH',
        memberIds: ['u_irene', 'u_pablo'],
        createdAt: now - 12 * DAY,
        entries: [entry(p(28), 'u_irene', 5, 'Croissants caseros.', 'Cola a partir de las 12.', 'Llegad pronto.', 10, ['u_irene', 'u_pablo'])],
        comments: [{ id: 'seed_c4', userId: 'u_pablo', text: '¡Bienvenidos al grupo del brunch! 🥐', createdAt: now - 12 * DAY }],
        polls: [],
      },
    ],
    visits: [
      { id: 'seed_v1', place: p(7), date: now - 30 * DAY },
      { id: 'seed_v2', place: p(3), date: now - 20 * DAY },
      { id: 'seed_v3', place: p(20), date: now - 10 * DAY },
      { id: 'seed_v4', place: p(23), date: now - 15 * DAY },
      { id: 'seed_v5', place: p(5), date: now - 3 * DAY },
    ],
  };
}

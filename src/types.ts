export type User = {
  id: string;
  name: string;
  avatar: string; // emoji
  color: string;
};

/** Restaurante tal y como llega del buscador (Google Places o datos de prueba). */
export type Place = {
  id: string; // place_id de Google
  name: string;
  address: string;
  area: string; // zona / barrio
  cuisine: string; // tipo de cocina
  rating?: number; // nota media en Google
  priceLevel?: number; // 1-4
  emoji: string;
};

/** Un restaurante dentro de una lista, con la opinión de quien lo añadió. */
export type Entry = {
  id: string;
  place: Place;
  addedBy: string;
  pros: string;
  cons: string;
  recommendation: string;
  score: number; // 1-5, la nota personal
  createdAt: number;
  votes?: string[]; // en listas de grupo: quién quiere ir
};

export type RestaurantList = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  emoji: string;
  isPublic: boolean;
  entries: Entry[];
  likes: string[];
  createdAt: number;
};

export type GroupComment = {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
};

export type PollOption = { id: string; text: string; votes: string[] };

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: number;
  closed: boolean;
};

export type Group = {
  id: string;
  name: string;
  emoji: string;
  inviteCode: string;
  memberIds: string[];
  entries: Entry[];
  comments: GroupComment[];
  polls: Poll[];
  createdAt: number;
};

export type Visit = {
  id: string;
  place: Place;
  date: number;
};

export type AppState = {
  version: number;
  lang?: 'es' | 'eu';
  meId: string;
  users: User[];
  lists: RestaurantList[];
  groups: Group[];
  visits: Visit[];
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createSeed, SEED_VERSION } from './data/seed';
import { deviceLang, Lang, setLang } from './i18n';
import { AppState, Entry, Group, Place, RestaurantList, User } from './types';

// Estado local persistido en el dispositivo. Cuando conectemos Supabase,
// estas mismas acciones pasarán a leer y escribir en la base de datos.
const STORAGE_KEY = 'donde-comemos/state';

export type EntryTarget = { type: 'list' | 'group'; id: string };
export type EntryInput = Pick<Entry, 'place' | 'pros' | 'cons' | 'recommendation' | 'score'>;

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function useAppStateInternal() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as AppState) : null;
        const s = parsed && parsed.version === SEED_VERSION ? parsed : createSeed();
        setState({ ...s, lang: s.lang ?? deviceLang() });
      })
      .catch(() => setState({ ...createSeed(), lang: deviceLang() }));
  }, []);

  useEffect(() => {
    if (state) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const mutate = useCallback((fn: (draft: AppState) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const draft = clone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const actions = useMemo(() => {
    const findList = (d: AppState, id: string) => d.lists.find((l) => l.id === id);
    const findGroup = (d: AppState, id: string) => d.groups.find((g) => g.id === id);

    return {
      createList(input: Pick<RestaurantList, 'title' | 'description' | 'emoji' | 'isPublic'>) {
        const id = uid('l');
        mutate((d) => {
          d.lists.unshift({ ...input, id, ownerId: d.meId, entries: [], likes: [], createdAt: Date.now() });
        });
        return id;
      },
      updateList(id: string, patch: Partial<Pick<RestaurantList, 'title' | 'description' | 'emoji' | 'isPublic'>>) {
        mutate((d) => Object.assign(findList(d, id)!, patch));
      },
      deleteList(id: string) {
        mutate((d) => {
          d.lists = d.lists.filter((l) => l.id !== id);
        });
      },
      toggleLike(listId: string) {
        mutate((d) => {
          const l = findList(d, listId);
          if (!l) return;
          l.likes = l.likes.includes(d.meId) ? l.likes.filter((u) => u !== d.meId) : [...l.likes, d.meId];
        });
      },
      addEntry(target: EntryTarget, input: EntryInput, markVisited: boolean) {
        mutate((d) => {
          const e: Entry = { ...input, id: uid('e'), addedBy: d.meId, createdAt: Date.now() };
          if (target.type === 'list') findList(d, target.id)?.entries.unshift(e);
          else findGroup(d, target.id)?.entries.unshift({ ...e, votes: [d.meId] });
          if (markVisited && !d.visits.some((v) => v.place.id === input.place.id)) {
            d.visits.unshift({ id: uid('v'), place: input.place, date: Date.now() });
          }
        });
      },
      updateEntry(target: EntryTarget, entryId: string, patch: Partial<EntryInput>) {
        mutate((d) => {
          const owner = target.type === 'list' ? findList(d, target.id) : findGroup(d, target.id);
          const e = owner?.entries.find((x) => x.id === entryId);
          if (e) Object.assign(e, patch);
        });
      },
      removeEntry(target: EntryTarget, entryId: string) {
        mutate((d) => {
          const owner = target.type === 'list' ? findList(d, target.id) : findGroup(d, target.id);
          if (owner) owner.entries = owner.entries.filter((e) => e.id !== entryId);
        });
      },
      toggleEntryVote(groupId: string, entryId: string) {
        mutate((d) => {
          const e = findGroup(d, groupId)?.entries.find((x) => x.id === entryId);
          if (!e) return;
          const v = e.votes ?? [];
          e.votes = v.includes(d.meId) ? v.filter((u) => u !== d.meId) : [...v, d.meId];
        });
      },
      createGroup(name: string, emoji: string, memberIds: string[]) {
        const id = uid('g');
        mutate((d) => {
          const g: Group = {
            id,
            name,
            emoji,
            inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
            memberIds: [d.meId, ...memberIds.filter((m) => m !== d.meId)],
            entries: [],
            comments: [],
            polls: [],
            createdAt: Date.now(),
          };
          d.groups.unshift(g);
        });
        return id;
      },
      addGroupMember(groupId: string, userId: string) {
        mutate((d) => {
          const g = findGroup(d, groupId);
          if (g && !g.memberIds.includes(userId)) g.memberIds.push(userId);
        });
      },
      leaveGroup(groupId: string) {
        mutate((d) => {
          d.groups = d.groups.filter((g) => g.id !== groupId);
        });
      },
      addComment(groupId: string, text: string) {
        mutate((d) => {
          findGroup(d, groupId)?.comments.push({ id: uid('c'), userId: d.meId, text, createdAt: Date.now() });
        });
      },
      createPoll(groupId: string, question: string, options: string[]) {
        mutate((d) => {
          findGroup(d, groupId)?.polls.unshift({
            id: uid('p'),
            question,
            createdBy: d.meId,
            createdAt: Date.now(),
            closed: false,
            options: options.map((text, i) => ({ id: `o${i + 1}`, text, votes: [] })),
          });
        });
      },
      votePoll(groupId: string, pollId: string, optionId: string) {
        mutate((d) => {
          const poll = findGroup(d, groupId)?.polls.find((p) => p.id === pollId);
          if (!poll || poll.closed) return;
          const already = poll.options.find((o) => o.id === optionId)?.votes.includes(d.meId);
          poll.options.forEach((o) => (o.votes = o.votes.filter((u) => u !== d.meId)));
          if (!already) poll.options.find((o) => o.id === optionId)!.votes.push(d.meId);
        });
      },
      togglePollClosed(groupId: string, pollId: string) {
        mutate((d) => {
          const poll = findGroup(d, groupId)?.polls.find((p) => p.id === pollId);
          if (poll) poll.closed = !poll.closed;
        });
      },
      addVisit(place: Place) {
        mutate((d) => {
          d.visits.unshift({ id: uid('v'), place, date: Date.now() });
        });
      },
      removeVisit(id: string) {
        mutate((d) => {
          d.visits = d.visits.filter((v) => v.id !== id);
        });
      },
      updateMe(patch: Partial<Pick<User, 'name' | 'avatar'>>) {
        mutate((d) => Object.assign(d.users.find((u) => u.id === d.meId)!, patch));
      },
      setLanguage(lang: Lang) {
        mutate((d) => {
          d.lang = lang;
        });
      },
      reset() {
        setState((prev) => ({ ...createSeed(), lang: prev?.lang ?? deviceLang() }));
      },
    };
  }, [mutate]);

  return { state, actions };
}

type Ctx = { state: AppState; actions: ReturnType<typeof useAppStateInternal>['actions'] };
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { state, actions } = useAppStateInternal();
  if (!state) return <>{fallback}</>;
  setLang(state.lang ?? 'es'); // antes de pintar, para que t() use el idioma elegido
  return <StoreContext.Provider value={{ state, actions }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fuera de StoreProvider');
  const { state } = ctx;
  const me = state.users.find((u) => u.id === state.meId)!;
  const userById = (id: string) => state.users.find((u) => u.id === id);
  return { ...ctx, me, userById };
}

/** Todos los restaurantes que conoce el usuario: sus listas, sus grupos y sus visitas. */
export function useKnownPlaces() {
  const { state } = useStore();
  const map = new Map<string, Place>();
  state.lists.filter((l) => l.ownerId === state.meId).forEach((l) => l.entries.forEach((e) => map.set(e.place.id, e.place)));
  state.groups.forEach((g) => g.entries.forEach((e) => map.set(e.place.id, e.place)));
  state.visits.forEach((v) => map.set(v.place.id, v.place));
  return [...map.values()];
}

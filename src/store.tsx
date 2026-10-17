import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { createSeed, SEED_VERSION } from './data/seed';
import { deviceLang, Lang, setLang, t } from './i18n';
import { loadAll, remote } from './services/remote';
import { supabase } from './services/supabase';
import { AppState, Entry, Group, Place, Poll, RestaurantList, User, Visit } from './types';
import { notify } from './utils';

// Dos modos:
// - local: sin Supabase configurado. Datos de ejemplo guardados en el dispositivo.
// - remoto: con Supabase. Cuentas reales; los cambios se ven al momento y se guardan en la base de datos.
export const isRemote = !!supabase;

const STORAGE_KEY = 'donde-comemos/state';
const LANG_KEY = 'donde-comemos/lang';
const REFRESH_MS = 15000;

export type EntryTarget = { type: 'list' | 'group'; id: string };
export type EntryInput = Pick<Entry, 'place' | 'pros' | 'cons' | 'recommendation' | 'score'>;

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
const inviteCode = () =>
  Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function emptyRemoteState(meId: string, lang: Lang): AppState {
  return { version: SEED_VERSION, lang, meId, users: [], lists: [], groups: [], visits: [] };
}

function useAppStateInternal() {
  const [state, setState] = useState<AppState | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isRemote);
  const stateRef = useRef(state);
  stateRef.current = state;
  const loadedOnce = useRef(false);

  // ---- Carga inicial
  useEffect(() => {
    if (!isRemote) {
      AsyncStorage.getItem(STORAGE_KEY)
        .then((raw) => {
          const parsed = raw ? (JSON.parse(raw) as AppState) : null;
          const s = parsed && parsed.version === SEED_VERSION ? parsed : createSeed();
          setState({ ...s, lang: s.lang ?? deviceLang() });
        })
        .catch(() => setState({ ...createSeed(), lang: deviceLang() }));
      return;
    }
    let alive = true;
    AsyncStorage.getItem(LANG_KEY)
      .catch(() => null)
      .then((l) => {
        if (l === 'es' || l === 'eu') setLang(l);
        else setLang(deviceLang());
      })
      .then(() => supabase!.auth.getSession())
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session);
        setAuthReady(true);
      });
    const { data: sub } = supabase!.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setState(null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---- Modo local: guardar en el dispositivo
  useEffect(() => {
    if (!isRemote && state) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // ---- Modo remoto: cargar y refrescar
  const meId = session?.user.id;
  const refresh = useCallback(async () => {
    if (!isRemote || !meId) return;
    try {
      const data = await loadAll(meId);
      loadedOnce.current = true;
      setState((prev) => ({ ...(prev ?? emptyRemoteState(meId, (stateRef.current?.lang ?? 'es') as Lang)), ...data, meId }));
    } catch (e: any) {
      if (!loadedOnce.current) {
        loadedOnce.current = true; // avisa una vez, no en cada refresco
        notify(t('error.load'), String(e?.message ?? e));
      }
    }
  }, [meId]);

  useEffect(() => {
    if (!isRemote || !meId) return;
    AsyncStorage.getItem(LANG_KEY)
      .catch(() => null)
      .then((l) => setState((prev) => prev ?? emptyRemoteState(meId, l === 'es' || l === 'eu' ? l : deviceLang())))
      .then(refresh);
    const timer = setInterval(() => {
      if (RNAppState.currentState === 'active') refresh();
    }, REFRESH_MS);
    const appSub = RNAppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(timer);
      appSub.remove();
    };
  }, [meId, refresh]);

  const mutate = useCallback((fn: (draft: AppState) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const draft = clone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  /** En modo remoto, guarda en Supabase; si falla, avisa y vuelve a cargar lo que hay en el servidor. */
  const sync = useCallback(
    (op: () => Promise<unknown>) => {
      if (!isRemote) return;
      op()
        .then(refresh)
        .catch((e) => {
          notify(t('error.sync'), String(e?.message ?? e));
          refresh();
        });
    },
    [refresh],
  );

  const actions = useMemo(() => {
    const findList = (d: AppState, id: string) => d.lists.find((l) => l.id === id);
    const findGroup = (d: AppState, id: string) => d.groups.find((g) => g.id === id);
    const me = () => stateRef.current!.meId;

    return {
      createList(input: Pick<RestaurantList, 'title' | 'description' | 'emoji' | 'isPublic'>) {
        const id = uuid();
        mutate((d) => {
          d.lists.unshift({ ...input, id, ownerId: d.meId, entries: [], likes: [], createdAt: Date.now() });
        });
        sync(() => remote.createList(id, input));
        return id;
      },
      updateList(id: string, patch: Partial<Pick<RestaurantList, 'title' | 'description' | 'emoji' | 'isPublic'>>) {
        mutate((d) => Object.assign(findList(d, id)!, patch));
        sync(() => remote.updateList(id, patch));
      },
      deleteList(id: string) {
        mutate((d) => {
          d.lists = d.lists.filter((l) => l.id !== id);
        });
        sync(() => remote.deleteList(id));
      },
      toggleLike(listId: string) {
        const liked = !stateRef.current?.lists.find((l) => l.id === listId)?.likes.includes(me());
        mutate((d) => {
          const l = findList(d, listId);
          if (!l) return;
          l.likes = liked ? [...l.likes, d.meId] : l.likes.filter((u) => u !== d.meId);
        });
        sync(() => remote.setLike(listId, me(), liked));
      },
      addEntry(target: EntryTarget, input: EntryInput, markVisited: boolean) {
        const e: Entry = { ...input, id: uuid(), addedBy: me(), createdAt: Date.now() };
        const already = stateRef.current?.visits.some((v) => v.place.id === input.place.id);
        const visit: Visit | null = markVisited && !already ? { id: uuid(), place: input.place, date: Date.now() } : null;
        mutate((d) => {
          if (target.type === 'list') findList(d, target.id)?.entries.unshift(e);
          else findGroup(d, target.id)?.entries.unshift({ ...e, votes: [d.meId] });
          if (visit) d.visits.unshift(visit);
        });
        sync(async () => {
          await remote.addEntry(target.type, target.id, e);
          if (visit) await remote.addVisit(visit);
        });
      },
      updateEntry(target: EntryTarget, entryId: string, patch: Partial<EntryInput>) {
        mutate((d) => {
          const owner = target.type === 'list' ? findList(d, target.id) : findGroup(d, target.id);
          const e = owner?.entries.find((x) => x.id === entryId);
          if (e) Object.assign(e, patch);
        });
        sync(() => remote.updateEntry(target.type, entryId, patch));
      },
      removeEntry(target: EntryTarget, entryId: string) {
        mutate((d) => {
          const owner = target.type === 'list' ? findList(d, target.id) : findGroup(d, target.id);
          if (owner) owner.entries = owner.entries.filter((e) => e.id !== entryId);
        });
        sync(() => remote.removeEntry(target.type, entryId));
      },
      toggleEntryVote(groupId: string, entryId: string) {
        const entry = stateRef.current?.groups.find((g) => g.id === groupId)?.entries.find((x) => x.id === entryId);
        const voted = !entry?.votes?.includes(me());
        mutate((d) => {
          const e = findGroup(d, groupId)?.entries.find((x) => x.id === entryId);
          if (!e) return;
          const v = e.votes ?? [];
          e.votes = voted ? [...v, d.meId] : v.filter((u) => u !== d.meId);
        });
        sync(() => remote.setEntryVote(entryId, me(), voted));
      },
      createGroup(name: string, emoji: string, memberIds: string[]) {
        const id = uuid();
        const code = inviteCode();
        mutate((d) => {
          const g: Group = {
            id,
            name,
            emoji,
            inviteCode: code,
            memberIds: [d.meId, ...memberIds.filter((m) => m !== d.meId)],
            entries: [],
            comments: [],
            polls: [],
            createdAt: Date.now(),
          };
          d.groups.unshift(g);
        });
        sync(() => remote.createGroup(id, name, emoji, code));
        return id;
      },
      /** Devuelve el id del grupo, o null si el código no existe. */
      async joinGroup(code: string): Promise<string | null> {
        const clean = code.trim().toUpperCase();
        if (isRemote) {
          const id = await remote.joinGroup(clean);
          if (id) await refresh();
          return id;
        }
        const g = stateRef.current?.groups.find((x) => x.inviteCode === clean);
        if (!g) return null;
        mutate((d) => {
          const grp = findGroup(d, g.id);
          if (grp && !grp.memberIds.includes(d.meId)) grp.memberIds.push(d.meId);
        });
        return g.id;
      },
      leaveGroup(groupId: string) {
        mutate((d) => {
          d.groups = d.groups.filter((g) => g.id !== groupId);
        });
        sync(() => remote.leaveGroup(groupId, me()));
      },
      addComment(groupId: string, text: string) {
        const id = uuid();
        mutate((d) => {
          findGroup(d, groupId)?.comments.push({ id, userId: d.meId, text, createdAt: Date.now() });
        });
        sync(() => remote.addComment(id, groupId, text));
      },
      createPoll(groupId: string, question: string, options: string[]) {
        const poll: Poll = {
          id: uuid(),
          question,
          createdBy: me(),
          createdAt: Date.now(),
          closed: false,
          options: options.map((text) => ({ id: uuid(), text, votes: [] })),
        };
        mutate((d) => {
          findGroup(d, groupId)?.polls.unshift(clone(poll));
        });
        sync(() => remote.createPoll(groupId, poll));
      },
      votePoll(groupId: string, pollId: string, optionId: string) {
        const poll = stateRef.current?.groups.find((g) => g.id === groupId)?.polls.find((p) => p.id === pollId);
        if (!poll || poll.closed) return;
        const already = poll.options.find((o) => o.id === optionId)?.votes.includes(me());
        mutate((d) => {
          const p = findGroup(d, groupId)?.polls.find((x) => x.id === pollId);
          if (!p) return;
          p.options.forEach((o) => (o.votes = o.votes.filter((u) => u !== d.meId)));
          if (!already) p.options.find((o) => o.id === optionId)!.votes.push(d.meId);
        });
        sync(() => remote.setPollVote(pollId, me(), already ? null : optionId));
      },
      togglePollClosed(groupId: string, pollId: string) {
        const closed = !stateRef.current?.groups.find((g) => g.id === groupId)?.polls.find((p) => p.id === pollId)?.closed;
        mutate((d) => {
          const poll = findGroup(d, groupId)?.polls.find((p) => p.id === pollId);
          if (poll) poll.closed = closed;
        });
        sync(() => remote.setPollClosed(pollId, closed));
      },
      addVisit(place: Place) {
        const v: Visit = { id: uuid(), place, date: Date.now() };
        mutate((d) => {
          d.visits.unshift(v);
        });
        sync(() => remote.addVisit(v));
      },
      removeVisit(id: string) {
        mutate((d) => {
          d.visits = d.visits.filter((v) => v.id !== id);
        });
        sync(() => remote.removeVisit(id));
      },
      updateMe(patch: Partial<Pick<User, 'name' | 'avatar'>>) {
        mutate((d) => {
          const u = d.users.find((x) => x.id === d.meId);
          if (u) Object.assign(u, patch);
        });
        sync(() => remote.updateMe(me(), patch));
      },
      setLanguage(lang: Lang) {
        setLang(lang);
        mutate((d) => {
          d.lang = lang;
        });
        if (isRemote) AsyncStorage.setItem(LANG_KEY, lang).catch(() => {});
      },
      reset() {
        setState((prev) => ({ ...createSeed(), lang: prev?.lang ?? deviceLang() }));
      },
      refresh,
      async signOut() {
        await supabase?.auth.signOut();
      },
    };
  }, [mutate, sync, refresh]);

  return { state, actions, authReady, session };
}

type Ctx = { state: AppState; actions: ReturnType<typeof useAppStateInternal>['actions'] };
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({
  children,
  fallback,
  login,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  login: React.ReactNode;
}) {
  const { state, actions, authReady, session } = useAppStateInternal();
  if (!authReady) return <>{fallback}</>;
  if (isRemote && !session) return <>{login}</>;
  if (!state) return <>{fallback}</>;
  setLang(state.lang ?? 'es'); // antes de pintar, para que t() use el idioma elegido
  return <StoreContext.Provider value={{ state, actions }}>{children}</StoreContext.Provider>;
}

const UNKNOWN_USER: User = { id: '', name: '…', avatar: '🙂', color: '#8A776C' };

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fuera de StoreProvider');
  const { state } = ctx;
  const me = state.users.find((u) => u.id === state.meId) ?? { ...UNKNOWN_USER, id: state.meId };
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

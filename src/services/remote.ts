import { AppState, Entry, Group, Place, Poll, RestaurantList, User, Visit } from '../types';
import { supabase } from './supabase';

// Lectura y escritura en Supabase. Los permisos (quién ve y edita qué) están en supabase/schema.sql.

const db = () => {
  if (!supabase) throw new Error('Supabase no está configurado');
  return supabase;
};

async function check<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

const ts = (s: string) => Date.parse(s);
const byNewest = (a: { createdAt: number }, b: { createdAt: number }) => b.createdAt - a.createdAt;

function toEntry(r: any): Entry {
  return {
    id: r.id,
    place: r.place as Place,
    addedBy: r.added_by,
    pros: r.pros,
    cons: r.cons,
    recommendation: r.recommendation,
    score: r.score,
    createdAt: ts(r.created_at),
    votes: r.entry_votes?.map((v: any) => v.user_id),
  };
}

export type RemoteData = Pick<AppState, 'users' | 'lists' | 'groups' | 'visits'>;

export async function loadAll(meId: string): Promise<RemoteData> {
  const [profiles, lists, groups, visits] = await Promise.all([
    check(db().from('profiles').select('id, name, avatar, color')),
    check(db().from('lists').select('*, list_entries(*), list_likes(user_id)').order('created_at', { ascending: false })),
    check(
      db()
        .from('groups')
        .select(
          '*, group_members(user_id), group_entries(*, entry_votes(user_id)), group_comments(*), polls(*, poll_options(*), poll_votes(user_id, option_id))',
        )
        .order('created_at', { ascending: false }),
    ),
    check(db().from('visits').select('*').eq('user_id', meId).order('visited_at', { ascending: false })),
  ]);

  const users: User[] = (profiles as any[]).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color }));

  const outLists: RestaurantList[] = (lists as any[]).map((l) => ({
    id: l.id,
    ownerId: l.owner_id,
    title: l.title,
    description: l.description,
    emoji: l.emoji,
    isPublic: l.is_public,
    createdAt: ts(l.created_at),
    likes: (l.list_likes ?? []).map((x: any) => x.user_id),
    entries: (l.list_entries ?? []).map(toEntry).sort(byNewest),
  }));

  const outGroups: Group[] = (groups as any[]).map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    inviteCode: g.invite_code,
    createdAt: ts(g.created_at),
    memberIds: (g.group_members ?? []).map((m: any) => m.user_id),
    entries: (g.group_entries ?? []).map(toEntry).sort(byNewest),
    comments: (g.group_comments ?? [])
      .map((c: any) => ({ id: c.id, userId: c.user_id, text: c.text, createdAt: ts(c.created_at) }))
      .sort((a: any, b: any) => a.createdAt - b.createdAt),
    polls: (g.polls ?? [])
      .map(
        (p: any): Poll => ({
          id: p.id,
          question: p.question,
          createdBy: p.created_by,
          createdAt: ts(p.created_at),
          closed: p.closed,
          options: (p.poll_options ?? [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((o: any) => ({
              id: o.id,
              text: o.text,
              votes: (p.poll_votes ?? []).filter((v: any) => v.option_id === o.id).map((v: any) => v.user_id),
            })),
        }),
      )
      .sort(byNewest),
  }));

  const outVisits: Visit[] = (visits as any[]).map((v) => ({ id: v.id, place: v.place, date: ts(v.visited_at) }));

  return { users, lists: outLists, groups: outGroups, visits: outVisits };
}

type ListFields = Partial<Pick<RestaurantList, 'title' | 'description' | 'emoji' | 'isPublic'>>;
const listRow = (f: ListFields) => {
  const row: Record<string, unknown> = {};
  if (f.title !== undefined) row.title = f.title;
  if (f.description !== undefined) row.description = f.description;
  if (f.emoji !== undefined) row.emoji = f.emoji;
  if (f.isPublic !== undefined) row.is_public = f.isPublic;
  return row;
};

const entryRow = (e: Partial<Entry>) => {
  const row: Record<string, unknown> = {};
  if (e.id !== undefined) row.id = e.id;
  if (e.place !== undefined) row.place = e.place;
  if (e.pros !== undefined) row.pros = e.pros;
  if (e.cons !== undefined) row.cons = e.cons;
  if (e.recommendation !== undefined) row.recommendation = e.recommendation;
  if (e.score !== undefined) row.score = e.score;
  return row;
};

const entryTable = (type: 'list' | 'group') => (type === 'list' ? 'list_entries' : 'group_entries');

export const remote = {
  createList: (id: string, f: ListFields) => check(db().from('lists').insert({ id, ...listRow(f) })),
  updateList: (id: string, f: ListFields) => check(db().from('lists').update(listRow(f)).eq('id', id)),
  deleteList: (id: string) => check(db().from('lists').delete().eq('id', id)),
  setLike: (listId: string, meId: string, liked: boolean) =>
    liked
      ? check(db().from('list_likes').insert({ list_id: listId }))
      : check(db().from('list_likes').delete().eq('list_id', listId).eq('user_id', meId)),

  async addEntry(type: 'list' | 'group', ownerId: string, e: Entry) {
    const fk = type === 'list' ? { list_id: ownerId } : { group_id: ownerId };
    await check(db().from(entryTable(type)).insert({ ...fk, ...entryRow(e) }));
    if (type === 'group') await check(db().from('entry_votes').insert({ entry_id: e.id }));
  },
  updateEntry: (type: 'list' | 'group', entryId: string, patch: Partial<Entry>) =>
    check(db().from(entryTable(type)).update(entryRow(patch)).eq('id', entryId)),
  removeEntry: (type: 'list' | 'group', entryId: string) => check(db().from(entryTable(type)).delete().eq('id', entryId)),
  setEntryVote: (entryId: string, meId: string, voted: boolean) =>
    voted
      ? check(db().from('entry_votes').insert({ entry_id: entryId }))
      : check(db().from('entry_votes').delete().eq('entry_id', entryId).eq('user_id', meId)),

  createGroup: (id: string, name: string, emoji: string, inviteCode: string) =>
    check(db().from('groups').insert({ id, name, emoji, invite_code: inviteCode })),
  async joinGroup(code: string): Promise<string | null> {
    return (await check(db().rpc('join_group', { code }))) as string | null;
  },
  leaveGroup: (groupId: string, meId: string) =>
    check(db().from('group_members').delete().eq('group_id', groupId).eq('user_id', meId)),
  addComment: (id: string, groupId: string, text: string) =>
    check(db().from('group_comments').insert({ id, group_id: groupId, text })),

  async createPoll(groupId: string, poll: Poll) {
    await check(db().from('polls').insert({ id: poll.id, group_id: groupId, question: poll.question }));
    await check(
      db()
        .from('poll_options')
        .insert(poll.options.map((o, i) => ({ id: o.id, poll_id: poll.id, text: o.text, position: i }))),
    );
  },
  async setPollVote(pollId: string, meId: string, optionId: string | null) {
    await check(db().from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', meId));
    if (optionId) await check(db().from('poll_votes').insert({ poll_id: pollId, option_id: optionId }));
  },
  setPollClosed: (pollId: string, closed: boolean) => check(db().from('polls').update({ closed }).eq('id', pollId)),

  addVisit: (v: Visit) => check(db().from('visits').insert({ id: v.id, place: v.place, visited_at: new Date(v.date).toISOString() })),
  removeVisit: (id: string) => check(db().from('visits').delete().eq('id', id)),
  updateMe: (meId: string, patch: Partial<Pick<User, 'name' | 'avatar'>>) =>
    check(db().from('profiles').update(patch).eq('id', meId)),
};

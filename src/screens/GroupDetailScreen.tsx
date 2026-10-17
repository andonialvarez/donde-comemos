import React, { useLayoutEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EntryCard } from '../components/EntryCard';
import { Avatar, Button, Card, Chip, ChipRow, Empty, Field, Screen, styles } from '../components/ui';
import { ScreenProps } from '../navigation';
import { t, tn } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';
import { Group, Poll } from '../types';
import { confirm, shareText, timeAgo } from '../utils';

type Tab = 'sitios' | 'votaciones' | 'chat';

export function GroupDetailScreen({ route, navigation }: ScreenProps<'GroupDetail'>) {
  const { state, actions, me, userById } = useStore();
  const group = state.groups.find((g) => g.id === route.params.id);
  const [tab, setTab] = useState<Tab>('sitios');

  useLayoutEffect(() => {
    navigation.setOptions({ title: group ? `${group.emoji} ${group.name}` : t('nav.group') });
  }, [navigation, group?.name, group?.emoji]);

  if (!group) return <Empty emoji="🤷" title={t('group.gone')} />;

  const invite = () =>
    shareText(t('group.inviteTitle', { name: group.name }), t('group.inviteText', { name: group.name, code: group.inviteCode }));

  const openPolls = group.polls.filter((p) => !p.closed).length;

  return (
    <Screen>
      <Card>
        <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
          {group.memberIds.map((id) => (
            <View key={id} style={{ alignItems: 'center', width: 52 }}>
              <Avatar user={userById(id)} size={36} />
              <Text style={[styles.muted, { fontSize: 11 }]} numberOfLines={1}>
                {id === me.id ? t('common.you') : userById(id)?.name}
              </Text>
            </View>
          ))}
        </View>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.muted}>
            {t('group.code')} <Text style={{ fontWeight: '800', color: colors.text, letterSpacing: 1 }}>{group.inviteCode}</Text>
          </Text>
          <Button small variant="secondary" title={t('group.invite')} onPress={invite} />
        </View>
      </Card>

      <ChipRow>
        <Chip label={t('group.tabPlaces', { n: group.entries.length })} active={tab === 'sitios'} onPress={() => setTab('sitios')} />
        <Chip label={`${t('group.tabPolls')}${openPolls ? ` (${openPolls})` : ''}`} active={tab === 'votaciones'} onPress={() => setTab('votaciones')} />
        <Chip label={t('group.tabChat', { n: group.comments.length })} active={tab === 'chat'} onPress={() => setTab('chat')} />
      </ChipRow>

      {tab === 'sitios' && <PlacesTab group={group} navigation={navigation} />}
      {tab === 'votaciones' && <PollsTab group={group} navigation={navigation} />}
      {tab === 'chat' && <ChatTab group={group} />}

      <Button
        variant="danger"
        small
        title={t('group.leave')}
        style={{ marginTop: 24, alignSelf: 'center' }}
        onPress={async () => {
          if (await confirm(t('group.leaveConfirm'), group.name, t('group.leaveBtn'))) {
            actions.leaveGroup(group.id);
            navigation.goBack();
          }
        }}
      />
    </Screen>
  );
}

function PlacesTab({ group, navigation }: { group: Group; navigation: ScreenProps<'GroupDetail'>['navigation'] }) {
  const { actions, me } = useStore();
  const target = { type: 'group' as const, id: group.id };
  const sorted = [...group.entries].sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0));
  return (
    <>
      <Button title={t('group.propose')} onPress={() => navigation.navigate('AddPlace', target)} />
      <Text style={styles.muted}>{t('group.voteHelp')}</Text>
      {sorted.length === 0 ? (
        <Empty emoji="🍴" title={t('group.noPlacesTitle')} text={t('group.noPlacesText')} />
      ) : (
        sorted.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            showAuthor
            onVote={() => actions.toggleEntryVote(group.id, e.id)}
            onDelete={
              e.addedBy === me.id
                ? async () => {
                    if (await confirm(t('group.removePlace'), e.place.name, t('common.remove'))) actions.removeEntry(target, e.id);
                  }
                : undefined
            }
          />
        ))
      )}
    </>
  );
}

function PollsTab({ group, navigation }: { group: Group; navigation: ScreenProps<'GroupDetail'>['navigation'] }) {
  return (
    <>
      <Button title={t('group.newPoll')} onPress={() => navigation.navigate('NewPoll', { groupId: group.id })} />
      {group.polls.length === 0 ? (
        <Empty emoji="🗳️" title={t('group.noPollsTitle')} text={t('group.noPollsText')} />
      ) : (
        group.polls.map((p) => <PollCard key={p.id} poll={p} groupId={group.id} />)
      )}
    </>
  );
}

function PollCard({ poll, groupId }: { poll: Poll; groupId: string }) {
  const { actions, me, userById } = useStore();
  const total = poll.options.reduce((n, o) => n + o.votes.length, 0);
  const max = Math.max(0, ...poll.options.map((o) => o.votes.length));
  return (
    <Card style={poll.closed && { opacity: 0.75 }}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={[styles.h3, { flex: 1 }]}>{poll.question}</Text>
        {poll.closed && <Text style={[styles.muted, { fontWeight: '700' }]}>{t('poll.closed')}</Text>}
      </View>
      <Text style={styles.muted}>
        {userById(poll.createdBy)?.name} · {timeAgo(poll.createdAt)} · {tn(total, 'poll.vote', 'poll.votes')}
      </Text>
      {poll.options.map((o) => {
        const mine = o.votes.includes(me.id);
        const pct = total ? Math.round((o.votes.length / total) * 100) : 0;
        const winning = poll.closed && o.votes.length === max && max > 0;
        return (
          <Pressable
            key={o.id}
            disabled={poll.closed}
            onPress={() => actions.votePoll(groupId, poll.id, o.id)}
            style={{
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: mine ? colors.primary : colors.border,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${pct}%`,
                backgroundColor: mine ? colors.primarySoft : '#F7EFE9',
              }}
            />
            <View style={[styles.row, { padding: 10, justifyContent: 'space-between' }]}>
              <Text style={[styles.body, mine && { fontWeight: '700' }]}>
                {winning ? '🏆 ' : mine ? '✓ ' : ''}
                {o.text}
              </Text>
              <View style={[styles.row, { gap: 6 }]}>
                <Text style={{ fontSize: 13 }}>{o.votes.map((u) => userById(u)?.avatar).join('')}</Text>
                <Text style={[styles.muted, { fontWeight: '700' }]}>{pct}%</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
      {poll.createdBy === me.id && (
        <Button
          small
          variant="ghost"
          title={t(poll.closed ? 'poll.reopen' : 'poll.close')}
          onPress={() => actions.togglePollClosed(groupId, poll.id)}
        />
      )}
    </Card>
  );
}

function ChatTab({ group }: { group: Group }) {
  const { actions, me, userById } = useStore();
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    actions.addComment(group.id, text.trim());
    setText('');
  };
  return (
    <>
      {group.comments.length === 0 && <Empty emoji="💬" title={t('group.noMsgTitle')} text={t('group.noMsgText')} />}
      {group.comments.map((c) => {
        const mine = c.userId === me.id;
        const u = userById(c.userId);
        return (
          <View key={c.id} style={[styles.row, { alignItems: 'flex-end' }, mine && { flexDirection: 'row-reverse' }]}>
            <Avatar user={u} size={28} />
            <View
              style={{
                maxWidth: '78%',
                backgroundColor: mine ? colors.primary : colors.card,
                borderRadius: 16,
                padding: 10,
                borderWidth: mine ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              {!mine && <Text style={{ fontSize: 12, fontWeight: '700', color: u?.color }}>{u?.name}</Text>}
              <Text style={[styles.body, mine && { color: '#fff' }]}>{c.text}</Text>
              <Text style={{ fontSize: 11, color: mine ? '#FFE3D6' : colors.muted, marginTop: 2 }}>{timeAgo(c.createdAt)}</Text>
            </View>
          </View>
        );
      })}
      <View style={[styles.row, { gap: 8 }]}>
        <View style={{ flex: 1 }}>
          <Field placeholder={t('group.msgPh')} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" />
        </View>
        <Button small title={t('group.send')} onPress={send} disabled={!text.trim()} />
      </View>
    </>
  );
}

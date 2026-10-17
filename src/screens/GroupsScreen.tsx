import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Button, Card, Empty, Field, Screen, SectionTitle, styles } from '../components/ui';
import { t, tn } from '../i18n';
import { useStore } from '../store';
import { notify } from '../utils';

export function GroupsScreen() {
  const nav = useNavigation<any>();
  const { state, actions, userById } = useStore();
  const [code, setCode] = useState('');
  const mine = state.groups.filter((g) => g.memberIds.includes(state.meId));

  const join = () => {
    const g = state.groups.find((x) => x.inviteCode === code.trim().toUpperCase());
    if (!g) return notify(t('groups.badCode'), t('groups.badCodeText'));
    if (g.memberIds.includes(state.meId)) return nav.navigate('GroupDetail', { id: g.id });
    actions.addGroupMember(g.id, state.meId);
    setCode('');
    nav.navigate('GroupDetail', { id: g.id });
  };

  return (
    <Screen>
      <Button title={t('groups.create')} onPress={() => nav.navigate('NewGroup')} />
      {mine.length === 0 ? (
        <Empty emoji="👥" title={t('groups.emptyTitle')} text={t('groups.emptyText')} />
      ) : (
        mine.map((g) => {
          const lastComment = g.comments[g.comments.length - 1];
          const openPolls = g.polls.filter((p) => !p.closed).length;
          return (
            <Card key={g.id} onPress={() => nav.navigate('GroupDetail', { id: g.id })}>
              <View style={styles.row}>
                <View style={[styles.thumb, { width: 52, height: 52, borderRadius: 16 }]}>
                  <Text style={{ fontSize: 26 }}>{g.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.h3}>{g.name}</Text>
                  <Text style={styles.muted}>
                    {tn(g.entries.length, 'common.place', 'common.places')} · {t('groups.people', { n: g.memberIds.length })}
                    {openPolls ? ` · 🗳️ ${tn(openPolls, 'groups.openPoll', 'groups.openPolls')}` : ''}
                  </Text>
                  <View style={[styles.row, { gap: 2 }]}>
                    {g.memberIds.slice(0, 6).map((id) => (
                      <Avatar key={id} user={userById(id)} size={22} />
                    ))}
                  </View>
                </View>
              </View>
              {lastComment && (
                <Text style={styles.muted} numberOfLines={1}>
                  💬 {userById(lastComment.userId)?.name}: {lastComment.text}
                </Text>
              )}
            </Card>
          );
        })
      )}

      <SectionTitle>{t('groups.join')}</SectionTitle>
      <View style={[styles.row, { gap: 8 }]}>
        <View style={{ flex: 1 }}>
          <Field placeholder={t('groups.codePh')} value={code} onChangeText={setCode} autoCapitalize="characters" />
        </View>
        <Button small title={t('groups.joinBtn')} disabled={!code.trim()} onPress={join} />
      </View>
    </Screen>
  );
}

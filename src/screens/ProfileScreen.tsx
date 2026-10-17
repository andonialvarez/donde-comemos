import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Button, Card, Chip, ChipRow, Empty, Field, PlaceMeta, PlaceThumb, Screen, SectionTitle, styles } from '../components/ui';
import { cuisineLabel, LANGUAGES, t } from '../i18n';
import { usingGoogle } from '../services/places';
import { useStore } from '../store';
import { colors } from '../theme';
import { confirm, timeAgo } from '../utils';

const AVATARS = ['🧑‍🍳', '😋', '🤤', '😎', '🦊', '🐼', '🐙', '👽', '🧔', '👩'];

export function ProfileScreen() {
  const { state, actions, me } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);

  const myLists = state.lists.filter((l) => l.ownerId === me.id);
  const likes = myLists.reduce((n, l) => n + l.likes.length, 0);
  const myGroups = state.groups.filter((g) => g.memberIds.includes(me.id));

  const cuisineCount = new Map<string, number>();
  state.visits.forEach((v) => cuisineCount.set(v.place.cuisine, (cuisineCount.get(v.place.cuisine) ?? 0) + 1));
  const topCuisines = [...cuisineCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
        <Avatar user={me} size={84} />
        {editing ? (
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <Field label={t('profile.name')} value={name} onChangeText={setName} />
            <ChipRow>
              {AVATARS.map((a) => (
                <Chip key={a} label={a} active={a === me.avatar} onPress={() => actions.updateMe({ avatar: a })} />
              ))}
            </ChipRow>
            <Button
              small
              title={t('common.save')}
              disabled={!name.trim()}
              onPress={() => {
                actions.updateMe({ name: name.trim() });
                setEditing(false);
              }}
            />
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.h1}>{me.name} ✏️</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.row, { gap: 8 }]}>
        <Stat n={state.visits.length} label={t('profile.visited')} />
        <Stat n={myLists.length} label={t('profile.lists')} />
        <Stat n={likes} label={t('profile.likes')} />
        <Stat n={myGroups.length} label={t('profile.groups')} />
      </View>

      <Card>
        <Text style={styles.label}>{t('profile.language')}</Text>
        <View style={[styles.row, { gap: 8 }]}>
          {LANGUAGES.map((l) => (
            <Chip key={l.code} label={l.label} active={(state.lang ?? 'es') === l.code} onPress={() => actions.setLanguage(l.code)} />
          ))}
        </View>
      </Card>

      {topCuisines.length > 0 && (
        <Card>
          <Text style={styles.label}>{t('profile.topCuisines')}</Text>
          <Text style={styles.body}>{topCuisines.map(([c, n]) => `${cuisineLabel(c)} (${n})`).join(' · ')}</Text>
        </Card>
      )}

      <SectionTitle>{t('profile.history')}</SectionTitle>
      {state.visits.length === 0 ? (
        <Empty emoji="🗺️" title={t('profile.noVisitsTitle')} text={t('profile.noVisitsText')} />
      ) : (
        state.visits.map((v) => (
          <Card key={v.id} style={styles.row}>
            <PlaceThumb place={v.place} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.h3} numberOfLines={1}>
                {v.place.name}
              </Text>
              <PlaceMeta place={v.place} />
              <Text style={styles.muted}>{timeAgo(v.date)}</Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={async () => {
                if (await confirm(t('profile.removeVisit'), v.place.name, t('common.remove'))) actions.removeVisit(v.id);
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
            </Pressable>
          </Card>
        ))
      )}

      <Card style={{ backgroundColor: colors.amberSoft, borderColor: colors.amberSoft, marginTop: 16 }}>
        <Text style={styles.h3}>{t('profile.testTitle')}</Text>
        <Text style={styles.body}>
          {t('profile.testText')}
          {usingGoogle ? '' : t('profile.testMock')}
        </Text>
        <Button
          small
          variant="ghost"
          title={t('profile.reset')}
          onPress={async () => {
            if (await confirm(t('profile.resetConfirm'), t('profile.resetText'), t('profile.resetBtn'))) actions.reset();
          }}
        />
      </Card>
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4, gap: 2 }}>
      <Text style={[styles.h2, { color: colors.primary }]}>{n}</Text>
      <Text style={[styles.muted, { fontSize: 11, textAlign: 'center' }]}>{label}</Text>
    </Card>
  );
}

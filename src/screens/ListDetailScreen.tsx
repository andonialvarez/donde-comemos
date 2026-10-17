import React, { useLayoutEffect } from 'react';
import { Text, View } from 'react-native';
import { EntryCard } from '../components/EntryCard';
import { Avatar, Button, Empty, Screen, styles } from '../components/ui';
import { ScreenProps } from '../navigation';
import { t } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';
import { confirm, shareList } from '../utils';

export function ListDetailScreen({ route, navigation }: ScreenProps<'ListDetail'>) {
  const { state, actions, me, userById } = useStore();
  const list = state.lists.find((l) => l.id === route.params.id);

  useLayoutEffect(() => {
    navigation.setOptions({ title: list ? list.title : t('nav.list') });
  }, [navigation, list?.title]);

  if (!list) return <Empty emoji="🤷" title={t('list.gone')} />;

  const owner = userById(list.ownerId);
  const isMine = list.ownerId === me.id;
  const liked = list.likes.includes(me.id);
  const target = { type: 'list' as const, id: list.id };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
        <Text style={{ fontSize: 48 }}>{list.emoji}</Text>
        <Text style={[styles.h1, { textAlign: 'center' }]}>{list.title}</Text>
        {list.description ? <Text style={[styles.body, { textAlign: 'center', color: colors.muted }]}>{list.description}</Text> : null}
        <View style={[styles.row, { gap: 6 }]}>
          <Avatar user={owner} size={24} />
          <Text style={styles.muted}>
            {isMine ? t('list.yours') : t('list.by', { name: owner?.name ?? '' })} · ❤️ {list.likes.length} · {t(list.isPublic ? 'common.public' : 'common.private')}
          </Text>
        </View>
      </View>

      <View style={[styles.row, { gap: 8 }]}>
        {isMine ? (
          <>
            <Button style={{ flex: 1 }} title={t('list.addPlace')} onPress={() => navigation.navigate('AddPlace', target)} />
            <Button variant="secondary" title="✏️" onPress={() => navigation.navigate('NewList', { id: list.id })} />
          </>
        ) : (
          <Button
            style={{ flex: 1 }}
            variant={liked ? 'secondary' : 'primary'}
            title={t(liked ? 'list.liked' : 'list.like')}
            onPress={() => actions.toggleLike(list.id)}
          />
        )}
        <Button variant="secondary" title={t('list.share')} onPress={() => shareList(list, owner?.name ?? '')} />
      </View>

      {list.entries.length === 0 ? (
        <Empty emoji="🍴" title={t('list.emptyTitle')} text={isMine ? t('list.emptyText') : undefined} />
      ) : (
        list.entries.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onDelete={
              isMine
                ? async () => {
                    if (await confirm(t('list.removeEntry'), e.place.name, t('common.remove'))) actions.removeEntry(target, e.id);
                  }
                : undefined
            }
          />
        ))
      )}

      {isMine && (
        <Button
          variant="danger"
          small
          title={t('list.delete')}
          style={{ marginTop: 16, alignSelf: 'center' }}
          onPress={async () => {
            if (await confirm(t('list.deleteConfirm'), t('list.cantUndo'), t('common.delete'))) {
              actions.deleteList(list.id);
              navigation.goBack();
            }
          }}
        />
      )}
    </Screen>
  );
}

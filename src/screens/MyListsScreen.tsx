import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ListCard } from '../components/ListCard';
import { Button, Empty, Screen, SectionTitle } from '../components/ui';
import { t } from '../i18n';
import { useStore } from '../store';

export function MyListsScreen() {
  const nav = useNavigation<any>();
  const { state } = useStore();
  const mine = state.lists.filter((l) => l.ownerId === state.meId);
  const liked = state.lists.filter((l) => l.ownerId !== state.meId && l.likes.includes(state.meId));

  return (
    <Screen>
      <Button title={t('myLists.create')} onPress={() => nav.navigate('NewList')} />
      {mine.length === 0 ? (
        <Empty emoji="📋" title={t('myLists.emptyTitle')} text={t('myLists.emptyText')} />
      ) : (
        mine.map((l) => <ListCard key={l.id} list={l} showOwner={false} onPress={() => nav.navigate('ListDetail', { id: l.id })} />)
      )}
      {liked.length > 0 && (
        <>
          <SectionTitle>{t('myLists.liked')}</SectionTitle>
          {liked.map((l) => (
            <ListCard key={l.id} list={l} onPress={() => nav.navigate('ListDetail', { id: l.id })} />
          ))}
        </>
      )}
    </Screen>
  );
}

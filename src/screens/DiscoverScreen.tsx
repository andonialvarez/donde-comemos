import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { ListCard } from '../components/ListCard';
import { Chip, ChipRow, Empty, Screen, styles } from '../components/ui';
import { t } from '../i18n';
import { useStore } from '../store';

export function DiscoverScreen() {
  const nav = useNavigation<any>();
  const { state } = useStore();
  const [sort, setSort] = useState<'top' | 'new'>('top');

  const lists = state.lists
    .filter((l) => l.isPublic && l.ownerId !== state.meId)
    .sort((a, b) => (sort === 'top' ? b.likes.length - a.likes.length : b.createdAt - a.createdAt));

  return (
    <Screen>
      <Text style={styles.muted}>{t('discover.intro')}</Text>
      <ChipRow>
        <Chip label={t('discover.top')} active={sort === 'top'} onPress={() => setSort('top')} />
        <Chip label={t('discover.new')} active={sort === 'new'} onPress={() => setSort('new')} />
      </ChipRow>
      {lists.length === 0 ? (
        <Empty emoji="🍽️" title={t('discover.emptyTitle')} text={t('discover.emptyText')} />
      ) : (
        lists.map((l) => <ListCard key={l.id} list={l} onPress={() => nav.navigate('ListDetail', { id: l.id })} />)
      )}
    </Screen>
  );
}

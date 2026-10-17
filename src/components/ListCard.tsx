import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { t, tn } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';
import { RestaurantList } from '../types';
import { Avatar, Card, styles } from './ui';

export function ListCard({ list, onPress, showOwner = true }: { list: RestaurantList; onPress: () => void; showOwner?: boolean }) {
  const { userById, me, actions } = useStore();
  const owner = userById(list.ownerId);
  const liked = list.likes.includes(me.id);
  const isMine = list.ownerId === me.id;

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.thumb, { width: 52, height: 52, borderRadius: 16 }]}>
          <Text style={{ fontSize: 26 }}>{list.emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.h3} numberOfLines={1}>
            {list.title}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {tn(list.entries.length, 'common.place', 'common.places')}
            {isMine ? ` · ${t(list.isPublic ? 'common.public' : 'common.private')}` : ''}
          </Text>
          {list.entries.length > 0 && (
            <Text style={{ fontSize: 15 }} numberOfLines={1}>
              {list.entries.slice(0, 6).map((e) => e.place.emoji).join(' ')}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        {showOwner ? (
          <View style={[styles.row, { gap: 6 }]}>
            <Avatar user={owner} size={22} />
            <Text style={styles.muted}>{isMine ? t('common.you') : owner?.name}</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable
          disabled={isMine}
          onPress={() => actions.toggleLike(list.id)}
          hitSlop={10}
          style={[styles.row, { gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: liked ? colors.primarySoft : 'transparent' }]}
        >
          <Text style={{ fontSize: 16 }}>{liked || isMine ? '❤️' : '🤍'}</Text>
          <Text style={[styles.muted, { fontWeight: '700', color: liked ? colors.primary : colors.muted }]}>{list.likes.length}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

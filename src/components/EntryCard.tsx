import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { t, tn } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';
import { Entry } from '../types';
import { timeAgo } from '../utils';
import { Avatar, Card, PlaceMeta, PlaceThumb, Stars, styles } from './ui';

export function EntryCard({
  entry,
  showAuthor,
  onVote,
  onDelete,
}: {
  entry: Entry;
  showAuthor?: boolean;
  onVote?: () => void;
  onDelete?: () => void;
}) {
  const { userById, me } = useStore();
  const author = userById(entry.addedBy);
  const voted = entry.votes?.includes(me.id);

  return (
    <Card>
      <View style={styles.row}>
        <PlaceThumb place={entry.place} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.h3} numberOfLines={1}>
            {entry.place.name}
          </Text>
          <PlaceMeta place={entry.place} />
          {entry.score > 0 ? <Stars value={entry.score} size={15} /> : <Text style={styles.muted}>{t('common.noScore')}</Text>}
        </View>
      </View>

      {entry.pros ? <Note bg={colors.greenSoft} icon="👍" text={entry.pros} /> : null}
      {entry.cons ? <Note bg={colors.redSoft} icon="👎" text={entry.cons} /> : null}
      {entry.recommendation ? <Note bg={colors.amberSoft} icon="💡" text={entry.recommendation} /> : null}

      {(showAuthor || onVote || onDelete) && (
        <View style={[styles.row, { justifyContent: 'space-between', marginTop: 2 }]}>
          {showAuthor ? (
            <View style={[styles.row, { gap: 6 }]}>
              <Avatar user={author} size={22} />
              <Text style={styles.muted}>
                {author?.id === me.id ? t('common.you') : author?.name} · {timeAgo(entry.createdAt)}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={[styles.row, { gap: 14 }]}>
            {onVote ? (
              <Pressable onPress={onVote} hitSlop={8} style={[styles.row, { gap: 4 }]}>
                <Text style={{ fontSize: 16 }}>{voted ? '🙋' : '✋'}</Text>
                <Text style={[styles.muted, voted && { color: colors.primary, fontWeight: '700' }]}>
                  {tn(entry.votes?.length ?? 0, 'entry.wantOne', 'entry.wantMany')}
                </Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} hitSlop={8}>
                <Text style={[styles.muted, { color: colors.red }]}>{t('common.remove')}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}
    </Card>
  );
}

function Note({ icon, text, bg }: { icon: string; text: string; bg: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, backgroundColor: bg, borderRadius: 10, padding: 10 }}>
      <Text>{icon}</Text>
      <Text style={[styles.body, { flex: 1, color: colors.text }]}>{text}</Text>
    </View>
  );
}

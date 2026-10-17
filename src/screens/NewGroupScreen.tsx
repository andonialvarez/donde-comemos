import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Button, Chip, ChipRow, Field, Screen, styles } from '../components/ui';
import { ScreenProps } from '../navigation';
import { t } from '../i18n';
import { isRemote, useStore } from '../store';
import { colors } from '../theme';

const EMOJIS = ['🍻', '🍕', '🥘', '🎉', '👨‍👩‍👧', '💼', '🏖️', '🥞', '🍷', '🔥'];

export function NewGroupScreen({ navigation }: ScreenProps<'NewGroup'>) {
  const { state, actions } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍻');
  const [members, setMembers] = useState<string[]>([]);
  const friends = state.users.filter((u) => u.id !== state.meId);

  const toggle = (id: string) => setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  return (
    <Screen>
      <Field label={t('newGroup.name')} placeholder={t('newGroup.namePh')} value={name} onChangeText={setName} autoFocus />
      <Text style={styles.label}>{t('common.icon')}</Text>
      <ChipRow>
        {EMOJIS.map((e) => (
          <Chip key={e} label={e} active={e === emoji} onPress={() => setEmoji(e)} />
        ))}
      </ChipRow>
      {!isRemote && <Text style={styles.label}>{t('newGroup.friends')}</Text>}
      <View style={{ gap: 8 }}>
        {(isRemote ? [] : friends).map((u) => {
          const on = members.includes(u.id);
          return (
            <Pressable
              key={u.id}
              onPress={() => toggle(u.id)}
              style={[
                styles.row,
                styles.card,
                { gap: 10, flexDirection: 'row' },
                on && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
              ]}
            >
              <Avatar user={u} />
              <Text style={[styles.h3, { flex: 1 }]}>{u.name}</Text>
              <Text style={{ fontSize: 18 }}>{on ? '✅' : '⬜'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.muted}>{t(isRemote ? 'newGroup.inviteHelp' : 'newGroup.help')}</Text>
      <Button
        title={t('newGroup.create')}
        disabled={!name.trim()}
        onPress={() => {
          const id = actions.createGroup(name.trim(), emoji, members);
          navigation.replace('GroupDetail', { id });
        }}
      />
    </Screen>
  );
}

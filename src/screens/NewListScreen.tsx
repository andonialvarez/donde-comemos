import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Button, Chip, ChipRow, Field, Screen, styles } from '../components/ui';
import { ScreenProps } from '../navigation';
import { t } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';

const EMOJIS = ['⭐', '🍕', '🍣', '🥘', '🍔', '🥩', '🍷', '💸', '❤️', '📝', '🌮', '🥐'];

export function NewListScreen({ route, navigation }: ScreenProps<'NewList'>) {
  const { state, actions } = useStore();
  const editing = route.params?.id ? state.lists.find((l) => l.id === route.params!.id) : undefined;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '⭐');
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? false);

  const save = () => {
    const data = { title: title.trim(), description: description.trim(), emoji, isPublic };
    if (editing) {
      actions.updateList(editing.id, data);
      navigation.goBack();
    } else {
      const id = actions.createList(data);
      navigation.replace('ListDetail', { id });
    }
  };

  return (
    <Screen>
      <Field label={t('newList.name')} placeholder={t('newList.namePh')} value={title} onChangeText={setTitle} autoFocus={!editing} />
      <Field label={t('newList.description')} placeholder={t('newList.descriptionPh')} value={description} onChangeText={setDescription} multiline />
      <Text style={styles.label}>{t('common.icon')}</Text>
      <ChipRow>
        {EMOJIS.map((e) => (
          <Chip key={e} label={e} active={e === emoji} onPress={() => setEmoji(e)} />
        ))}
      </ChipRow>
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h3}>{t('newList.public')}</Text>
          <Text style={styles.muted}>{t('newList.publicHelp')}</Text>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.primary }} />
      </View>
      <Button title={t(editing ? 'newList.saveChanges' : 'newList.create')} disabled={!title.trim()} onPress={save} style={{ marginTop: 8 }} />
    </Screen>
  );
}

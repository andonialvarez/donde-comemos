import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Chip, ChipRow, Field, Screen, styles } from '../components/ui';
import { ScreenProps } from '../navigation';
import { t } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';

export function NewPollScreen({ route, navigation }: ScreenProps<'NewPoll'>) {
  const { state, actions } = useStore();
  const group = state.groups.find((g) => g.id === route.params.groupId);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const setOption = (i: number, v: string) => setOptions((o) => o.map((x, j) => (j === i ? v : x)));
  const valid = options.map((o) => o.trim()).filter(Boolean);

  const suggestions = [
    { q: t('poll.qWhere'), opts: (group?.entries ?? []).slice(0, 4).map((e) => e.place.name) },
    { q: t('poll.qDay'), opts: [t('poll.fri'), t('poll.sat'), t('poll.sun')] },
    { q: t('poll.qTime'), opts: ['20:30', '21:00', '21:30'] },
  ].filter((s) => s.opts.length >= 2);

  return (
    <Screen>
      <Text style={styles.label}>{t('poll.ideas')}</Text>
      <ChipRow>
        {suggestions.map((s) => (
          <Chip
            key={s.q}
            label={s.q}
            onPress={() => {
              setQuestion(s.q);
              setOptions(s.opts);
            }}
          />
        ))}
      </ChipRow>
      <Field label={t('poll.question')} placeholder={t('poll.questionPh')} value={question} onChangeText={setQuestion} />
      <Text style={styles.label}>{t('poll.options')}</Text>
      {options.map((o, i) => (
        <View key={i} style={[styles.row, { gap: 8 }]}>
          <View style={{ flex: 1 }}>
            <Field placeholder={t('poll.optionPh', { n: i + 1 })} value={o} onChangeText={(v) => setOption(i, v)} />
          </View>
          {options.length > 2 && (
            <Pressable onPress={() => setOptions((x) => x.filter((_, j) => j !== i))} hitSlop={8}>
              <Text style={{ color: colors.red, fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>
      ))}
      {options.length < 8 && <Button small variant="ghost" title={t('poll.addOption')} onPress={() => setOptions((x) => [...x, ''])} />}
      <Button
        title={t('poll.create')}
        disabled={!question.trim() || valid.length < 2}
        onPress={() => {
          actions.createPoll(route.params.groupId, question.trim(), valid);
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

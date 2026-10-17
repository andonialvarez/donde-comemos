import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Switch, Text, View } from 'react-native';
import { Button, Card, Chip, ChipRow, Empty, PlaceMeta, Screen, styles } from '../components/ui';
import { cuisineLabel, t, tn } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';
import { Place } from '../types';

type Source = { key: string; label: string; places: Place[] };

export function RouletteScreen() {
  const nav = useNavigation<any>();
  const { state, actions } = useStore();

  const sources = useMemo<Source[]>(() => {
    const all = new Map<string, Place>();
    const mine = state.lists.filter((l) => l.ownerId === state.meId);
    mine.forEach((l) => l.entries.forEach((e) => all.set(e.place.id, e.place)));
    state.groups.forEach((g) => g.entries.forEach((e) => all.set(e.place.id, e.place)));
    state.visits.forEach((v) => all.set(v.place.id, v.place));
    return [
      { key: 'all', label: t('roulette.all'), places: [...all.values()] },
      ...mine.map((l) => ({ key: l.id, label: `${l.emoji} ${l.title}`, places: l.entries.map((e) => e.place) })),
      ...state.groups.map((g) => ({ key: g.id, label: `${g.emoji} ${g.name}`, places: g.entries.map((e) => e.place) })),
    ];
  }, [state]);

  const [sourceKey, setSourceKey] = useState('all');
  const [area, setArea] = useState<string | null>(null);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);
  const [display, setDisplay] = useState<Place | null>(null);
  const [result, setResult] = useState<Place | null>(null);
  const [spinning, setSpinning] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const base = sources.find((s) => s.key === sourceKey)?.places ?? [];
  const areas = [...new Set(base.map((p) => p.area))].sort();
  const cuisines = [...new Set(base.filter((p) => !area || p.area === area).map((p) => p.cuisine))].sort();
  const visitedIds = new Set(state.visits.map((v) => v.place.id));
  const candidates = base.filter(
    (p) => (!area || p.area === area) && (!cuisine || p.cuisine === cuisine) && (!onlyNew || !visitedIds.has(p.id)),
  );

  const go = () => {
    if (candidates.length === 0 || spinning) return;
    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    setResult(null);
    setSpinning(true);
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 2600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // Va mostrando nombres cada vez más despacio hasta parar en el ganador.
    timers.current.forEach(clearTimeout);
    timers.current = [];
    let t = 0;
    for (let i = 0; i < 22; i++) {
      t += 40 + i * i * 0.45;
      timers.current.push(setTimeout(() => setDisplay(candidates[Math.floor(Math.random() * candidates.length)]), t));
    }
    timers.current.push(
      setTimeout(() => {
        setDisplay(winner);
        setResult(winner);
        setSpinning(false);
      }, t + 200),
    );
  };

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1800deg'] });
  const shown = display ?? result;

  return (
    <Screen>
      <Text style={styles.label}>{t('roulette.source')}</Text>
      <ChipRow>
        {sources.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            active={s.key === sourceKey}
            onPress={() => {
              setSourceKey(s.key);
              setArea(null);
              setCuisine(null);
            }}
          />
        ))}
      </ChipRow>

      <Text style={styles.label}>{t('roulette.area')}</Text>
      <ChipRow>
        <Chip label={t('roulette.allAreas')} active={!area} onPress={() => setArea(null)} />
        {areas.map((a) => (
          <Chip key={a} label={a} active={a === area} onPress={() => (setArea(a === area ? null : a), setCuisine(null))} />
        ))}
      </ChipRow>

      <Text style={styles.label}>{t('roulette.cuisine')}</Text>
      <ChipRow>
        <Chip label={t('roulette.allCuisines')} active={!cuisine} onPress={() => setCuisine(null)} />
        {cuisines.map((c) => (
          <Chip key={c} label={cuisineLabel(c)} active={c === cuisine} onPress={() => setCuisine(c === cuisine ? null : c)} />
        ))}
      </ChipRow>

      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.body}>{t('roulette.onlyNew')}</Text>
        <Switch value={onlyNew} onValueChange={setOnlyNew} trackColor={{ true: colors.primary }} />
      </View>

      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <View style={{ width: 230, height: 230, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: 230,
              height: 230,
              borderRadius: 115,
              borderWidth: 14,
              borderColor: colors.primary,
              borderTopColor: colors.amber,
              borderBottomColor: colors.green,
              borderLeftColor: '#7C5CFA',
              transform: [{ rotate }],
            }}
          />
          <View style={{ alignItems: 'center', paddingHorizontal: 30, gap: 4 }}>
            <Text style={{ fontSize: 52 }}>{shown?.emoji ?? '🎡'}</Text>
            <Text style={[styles.h3, { textAlign: 'center' }]} numberOfLines={2}>
              {shown?.name ?? tn(candidates.length, 'common.place', 'common.places')}
            </Text>
          </View>
        </View>
      </View>

      {candidates.length === 0 ? (
        <Empty emoji="🤔" title={t('roulette.emptyTitle')} text={t('roulette.emptyText')} />
      ) : (
        <Button title={t(spinning ? 'roulette.spinning' : result ? 'roulette.again' : 'roulette.spin')} onPress={go} disabled={spinning} />
      )}

      {result && !spinning && (
        <Card style={{ borderColor: colors.primary, borderWidth: 2 }}>
          <Text style={styles.label}>{t('roulette.tonight')}</Text>
          <Text style={styles.h2}>
            {result.emoji} {result.name}
          </Text>
          <Text style={styles.muted}>{result.address}</Text>
          <PlaceMeta place={result} />
          <Button
            small
            variant="secondary"
            title={t('roulette.went')}
            onPress={() => {
              actions.addVisit(result);
              setResult(null);
              setDisplay(null);
              nav.navigate('Profile');
            }}
          />
        </Card>
      )}
    </Screen>
  );
}

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { Button, Card, Field, PlaceMeta, PlaceThumb, Screen, Stars, styles } from '../components/ui';
import { ScreenProps } from '../navigation';
import { searchPlaces, usingGoogle } from '../services/places';
import { t } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';
import { Place } from '../types';

export function AddPlaceScreen({ route, navigation }: ScreenProps<'AddPlace'>) {
  const target = route.params;
  const { actions } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [place, setPlace] = useState<Place | null>(null);

  const [score, setScore] = useState(0);
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [visited, setVisited] = useState(target.type === 'list');

  useEffect(() => {
    let alive = true;
    setError('');
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchPlaces(query)
        .then((r) => alive && setResults(r))
        .catch((e) => alive && setError(String(e.message ?? e)))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  if (!place) {
    return (
      <Screen>
        <Field placeholder={t('add.searchPh')} value={query} onChangeText={setQuery} autoFocus />
        <Text style={styles.muted}>
          {t(usingGoogle ? 'add.google' : 'add.mock')}
        </Text>
        {loading && <ActivityIndicator color={colors.primary} />}
        {error ? <Text style={{ color: colors.red }}>{error}</Text> : null}
        {!loading && query.trim().length >= 2 && results.length === 0 && !error ? (
          <Text style={styles.muted}>{t('add.noResults', { q: query })}</Text>
        ) : null}
        {results.map((p) => (
          <Pressable key={p.id} onPress={() => setPlace(p)}>
            <Card style={styles.row}>
              <PlaceThumb place={p} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.h3} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {p.address}
                </Text>
                <PlaceMeta place={p} />
              </View>
            </Card>
          </Pressable>
        ))}
      </Screen>
    );
  }

  const save = () => {
    actions.addEntry(target, { place, score, pros: pros.trim(), cons: cons.trim(), recommendation: recommendation.trim() }, visited);
    navigation.goBack();
  };

  return (
    <Screen>
      <Card style={styles.row}>
        <PlaceThumb place={place} />
        <View style={{ flex: 1 }}>
          <Text style={styles.h3}>{place.name}</Text>
          <Text style={styles.muted}>{place.address}</Text>
          <PlaceMeta place={place} />
        </View>
        <Pressable onPress={() => setPlace(null)} hitSlop={8}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('add.change')}</Text>
        </Pressable>
      </Card>

      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View>
          <Text style={styles.h3}>{t('add.visited')}</Text>
          <Text style={styles.muted}>{t('add.visitedHelp')}</Text>
        </View>
        <Switch value={visited} onValueChange={setVisited} trackColor={{ true: colors.primary }} />
      </View>

      {visited && (
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>{t('add.score')}</Text>
          <Stars value={score} onChange={setScore} size={32} />
        </View>
      )}
      <Field label={t('add.pros')} placeholder={t('add.prosPh')} value={pros} onChangeText={setPros} multiline />
      <Field label={t('add.cons')} placeholder={t('add.consPh')} value={cons} onChangeText={setCons} multiline />
      <Field label={t('add.reco')} placeholder={t('add.recoPh')} value={recommendation} onChangeText={setRecommendation} multiline />
      <Button title={t('common.save')} onPress={save} style={{ marginTop: 8 }} />
    </Screen>
  );
}

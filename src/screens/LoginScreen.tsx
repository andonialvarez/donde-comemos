import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Field, styles } from '../components/ui';
import { getLang, Lang, LANGUAGES, setLang, t } from '../i18n';
import { signInWithGoogle, supabase } from '../services/supabase';
import { colors } from '../theme';
import { notify } from '../utils';

export function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [lang, setLangState] = useState<Lang>(getLang());

  const changeLang = (l: Lang) => {
    setLang(l);
    setLangState(l);
  };

  const submit = async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          notify(t('auth.checkEmail'), t('auth.checkEmailText'));
          setMode('login');
        }
      }
    } catch (e: any) {
      notify(t('auth.error'), String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const valid = email.includes('@') && password.length >= 6 && (mode === 'login' || name.trim().length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} key={lang}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 14, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Text style={{ fontSize: 64 }}>🍽️</Text>
            <Text style={styles.h1}>{t('auth.title')}</Text>
            <Text style={[styles.body, { color: colors.muted, textAlign: 'center' }]}>{t('auth.subtitle')}</Text>
          </View>
          {Platform.OS === 'web' && (
            <>
              <Button
                variant="secondary"
                title={`G  ${t('auth.google')}`}
                disabled={busy}
                onPress={() => signInWithGoogle().catch((e) => notify(t('auth.error'), String(e?.message ?? e)))}
              />
              <Text style={[styles.muted, { textAlign: 'center' }]}>{t('auth.or')}</Text>
            </>
          )}
          {mode === 'signup' && <Field placeholder={t('auth.name')} value={name} onChangeText={setName} autoComplete="name" />}
          <Field
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onSubmitEditing={() => valid && submit()}
          />
          <Button title={t(mode === 'login' ? 'auth.login' : 'auth.signup')} onPress={submit} disabled={!valid || busy} />
          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ alignItems: 'center', padding: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{t(mode === 'login' ? 'auth.toSignup' : 'auth.toLogin')}</Text>
          </Pressable>
          <View style={[styles.row, { justifyContent: 'center', gap: 8, marginTop: 8 }]}>
            {LANGUAGES.map((l) => (
              <Chip key={l.code} label={l.label} active={lang === l.code} onPress={() => changeLang(l.code)} />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

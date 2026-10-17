import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Si no hay URL y clave, la app funciona en modo prueba con datos locales.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: Platform.OS === 'web' },
      })
    : null;

// Entrar con Google. En la web se va a Google y vuelve a esta misma página con la sesión en la URL.
// En la app se abre el navegador y Google vuelve a dondecomemos://auth con los tokens.
const APP_REDIRECT = 'dondecomemos://auth';

export async function signInWithGoogle() {
  if (!supabase) return;
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) throw error;
    return;
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: APP_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const res = await WebBrowser.openAuthSessionAsync(data.url, APP_REDIRECT);
  if (res.type !== 'success') return;
  const [, query = ''] = res.url.split('?');
  const params = new URLSearchParams(res.url.includes('#') ? res.url.split('#')[1] : query);
  const errorText = params.get('error_description');
  if (errorText) throw new Error(errorText);
  const code = params.get('code');
  if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) throw e;
    return;
  }
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) throw new Error('Google no ha devuelto la sesión');
  const { error: e } = await supabase.auth.setSession({ access_token, refresh_token });
  if (e) throw e;
}

import { Alert, Platform, Share } from 'react-native';
import { t, tn } from './i18n';
import { RestaurantList } from './types';

export type DialogButton = { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void };
export type DialogRequest = { title: string; message?: string; buttons?: DialogButton[] };

let dialogHandler: ((req: DialogRequest) => void) | null = null;
export const setDialogHandler = (h: typeof dialogHandler) => {
  dialogHandler = h;
};

function showDialog(title: string, message?: string, buttons?: DialogButton[]) {
  if (Platform.OS === 'web' && dialogHandler) dialogHandler({ title, message, buttons });
  else Alert.alert(title, message, buttons);
}

export function notify(title: string, message?: string) {
  showDialog(title, message);
}

export function confirm(title: string, message: string, confirmText = t('common.accept')): Promise<boolean> {
  return new Promise((resolve) =>
    showDialog(title, message, [
      { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

/** Comparte un texto. En la web, si el navegador no deja compartir, lo muestra para copiarlo. */
export async function shareText(title: string, message: string) {
  if (Platform.OS !== 'web') {
    await Share.share({ message, title });
    return;
  }
  const nav: any = typeof navigator !== 'undefined' ? navigator : null;
  try {
    if (nav?.share) {
      await nav.share({ title, text: message });
      return;
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') return; // el usuario canceló
  }
  showDialog(title, message, [
    { text: t('common.close'), style: 'cancel' },
    {
      text: t('share.copy'),
      onPress: () => {
        nav?.clipboard?.writeText(message).then(
          () => notify(t('share.copied'), t('share.copiedText')),
          () => notify(t('share.copyFailed'), t('share.copyFailedText')),
        );
      },
    },
  ]);
}

export function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return t('time.now');
  const m = Math.round(s / 60);
  if (m < 60) return t('time.min', { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t('time.hour', { n: h });
  const d = Math.round(h / 24);
  if (d < 30) return tn(d, 'time.day', 'time.days');
  const mo = Math.round(d / 30);
  return tn(mo, 'time.month', 'time.months');
}

export const price = (lvl?: number) => (lvl ? '€'.repeat(lvl) : '');

export async function shareList(list: RestaurantList, ownerName: string) {
  const lines = [
    t('share.listHeader', { emoji: list.emoji, title: list.title, owner: ownerName }),
    list.description,
    '',
    ...list.entries.map((e, i) => {
      const parts = [`${i + 1}. ${e.place.name} (${e.place.area})${e.score ? ` · ${'★'.repeat(e.score)}` : ''}`];
      if (e.pros) parts.push(`   👍 ${e.pros}`);
      if (e.cons) parts.push(`   👎 ${e.cons}`);
      if (e.recommendation) parts.push(`   💡 ${e.recommendation}`);
      return parts.join('\n');
    }),
  ].filter((l, i) => i !== 1 || l);
  return shareText(list.title, lines.join('\n'));
}

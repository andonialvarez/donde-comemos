import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { t } from '../i18n';
import { DialogRequest, setDialogHandler } from '../utils';
import { Button, styles } from './ui';

// Diálogos propios para la web, donde alert() y confirm() del navegador
// pueden estar bloqueados (por ejemplo dentro de la vista previa).
export function DialogHost() {
  const [req, setReq] = useState<DialogRequest | null>(null);

  useEffect(() => {
    setDialogHandler(setReq);
    return () => setDialogHandler(null);
  }, []);

  const close = () => setReq(null);

  return (
    <Modal visible={!!req} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        onPress={close}
        style={{ flex: 1, backgroundColor: 'rgba(43,29,22,0.45)', justifyContent: 'center', padding: 24 }}
      >
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, gap: 12, maxHeight: '80%' }}
        >
          <Text style={styles.h2}>{req?.title}</Text>
          {req?.message ? (
            <ScrollView style={{ maxHeight: 320 }}>
              <Text style={[styles.body, { color: colors.muted }]} selectable>
                {req.message}
              </Text>
            </ScrollView>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {(req?.buttons ?? [{ text: t('common.ok') }]).map((b) => (
              <Button
                key={b.text}
                small
                title={b.text}
                variant={b.style === 'cancel' ? 'ghost' : b.style === 'destructive' ? 'danger' : 'primary'}
                onPress={() => {
                  close();
                  b.onPress?.();
                }}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DialogHost } from './src/components/DialogHost';
import { RootNavigator } from './src/navigation';
import { LoginScreen } from './src/screens/LoginScreen';
import { StoreProvider } from './src/store';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <StoreProvider
        login={
          <>
            <LoginScreen />
            <DialogHost />
          </>
        }
        fallback={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        }
      >
        <RootNavigator />
        <DialogHost />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

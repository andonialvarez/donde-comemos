import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';
import { AddPlaceScreen } from './screens/AddPlaceScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { GroupDetailScreen } from './screens/GroupDetailScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { ListDetailScreen } from './screens/ListDetailScreen';
import { MyListsScreen } from './screens/MyListsScreen';
import { NewGroupScreen } from './screens/NewGroupScreen';
import { NewListScreen } from './screens/NewListScreen';
import { NewPollScreen } from './screens/NewPollScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RouletteScreen } from './screens/RouletteScreen';
import { t } from './i18n';
import { useStore } from './store';
import { colors } from './theme';

export type RootStackParamList = {
  Tabs: undefined;
  ListDetail: { id: string };
  GroupDetail: { id: string };
  AddPlace: { type: 'list' | 'group'; id: string };
  NewList: { id?: string } | undefined;
  NewGroup: undefined;
  NewPoll: { groupId: string };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 20, lineHeight: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

function Tabs() {
  useStore(); // vuelve a pintar las pestañas al cambiar de idioma
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarIcon: icon('🔥'), title: t('nav.discover') }} />
      <Tab.Screen name="MyLists" component={MyListsScreen} options={{ tabBarIcon: icon('📋'), title: t('nav.myLists') }} />
      <Tab.Screen
        name="Roulette"
        component={RouletteScreen}
        options={{ tabBarIcon: icon('🎡'), title: t('nav.rouletteTitle'), tabBarLabel: t('nav.roulette') }}
      />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ tabBarIcon: icon('👥'), title: t('nav.groups') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('🙂'), title: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } };

export function RootNavigator() {
  useStore(); // vuelve a pintar los títulos al cambiar de idioma
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '800', color: colors.text },
          headerBackTitle: t('common.back'),
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="ListDetail" component={ListDetailScreen} options={{ title: t('nav.list') }} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: t('nav.group') }} />
        <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={{ title: t('nav.addPlace'), presentation: 'modal' }} />
        <Stack.Screen name="NewList" component={NewListScreen} options={{ title: t('nav.newList'), presentation: 'modal' }} />
        <Stack.Screen name="NewGroup" component={NewGroupScreen} options={{ title: t('nav.newGroup'), presentation: 'modal' }} />
        <Stack.Screen name="NewPoll" component={NewPollScreen} options={{ title: t('nav.newPoll'), presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

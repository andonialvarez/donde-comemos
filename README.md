# Dónde Comemos

App (Expo + React Native + TypeScript) para guardar y compartir listas de restaurantes.

- **Descubrir**: listas públicas de amigos, con me gusta.
- **Mis listas**: listas propias con opinión por sitio (lo bueno, lo malo, recomendación y nota).
- **Añadir restaurante**: se elige del buscador (Google Places si hay clave; si no, restaurantes de ejemplo).
- **Ruleta "¿Dónde cenamos hoy?"**: elige al azar entre tus sitios, filtrando por zona, tipo y lista/grupo.
- **Grupos**: lista compartida, votos de "quiero ir", votaciones y chat.
- **Perfil**: dónde has estado, estadísticas y selector de idioma (castellano o euskera, textos en `src/i18n.ts`).

Estado actual: versión de prueba. Los datos se guardan en el dispositivo (AsyncStorage) y los amigos son de ejemplo.
El siguiente paso es conectar Supabase (cuentas, datos compartidos de verdad) y Google Places.

## Ejecutar

```bash
npm install
npx expo start          # escanea el QR con Expo Go en el móvil
npx expo start --web    # en el navegador
```

Para usar Google Places, copia `.env.example` a `.env` y pon la clave.

## Vista previa en un solo archivo

```bash
npx expo export -p web && node scripts/build-preview.mjs   # genera preview/index.html
```

## Estructura

- `App.tsx`: raíz.
- `src/navigation.tsx`: pestañas y pantallas.
- `src/store.tsx`: estado y acciones (aquí se conectará Supabase).
- `src/services/places.ts`: búsqueda de restaurantes (Google Places o ejemplo).
- `src/screens/`: pantallas. `src/components/`: piezas reutilizables.

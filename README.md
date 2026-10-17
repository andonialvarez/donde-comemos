# Dónde Comemos

App (Expo + React Native + TypeScript) para guardar y compartir listas de restaurantes.

- **Descubrir**: listas públicas de amigos, con me gusta.
- **Mis listas**: listas propias con opinión por sitio (lo bueno, lo malo, recomendación y nota).
- **Añadir restaurante**: se elige del buscador (Google Places si hay clave; si no, restaurantes de ejemplo).
- **Ruleta "¿Dónde cenamos hoy?"**: elige al azar entre tus sitios, filtrando por zona, tipo y lista/grupo.
- **Grupos**: lista compartida, votos de "quiero ir", votaciones y chat.
- **Perfil**: dónde has estado, estadísticas y selector de idioma (castellano o euskera, textos en `src/i18n.ts`).

Dos modos:
- **Con Supabase** (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY` en `.env`): cuentas reales y datos compartidos.
  Las tablas y permisos están en `supabase/schema.sql` (pegar en Supabase > SQL Editor).
- **Modo prueba** (sin esas variables): datos de ejemplo guardados en el dispositivo.

## Ejecutar

```bash
npm install
npx expo start          # escanea el QR con Expo Go en el móvil
npx expo start --web    # en el navegador
```

Copia `.env.example` a `.env` y rellena las claves de Google Places y Supabase.

## Vista previa en un solo archivo

```bash
npx expo export -p web && node scripts/build-preview.mjs                # preview/index.html (vista previa)
npx expo export -p web && node scripts/build-preview.mjs --standalone   # site/index.html (GitHub Pages, rama gh-pages)
```

## Estructura

- `App.tsx`: raíz.
- `src/navigation.tsx`: pestañas y pantallas.
- `src/store.tsx`: estado y acciones (modo prueba o Supabase).
- `src/services/remote.ts`: lectura y escritura en Supabase.
- `src/i18n.ts`: textos en castellano y euskera.
- `src/services/places.ts`: búsqueda de restaurantes (Google Places o ejemplo).
- `src/screens/`: pantallas. `src/components/`: piezas reutilizables.

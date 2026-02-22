import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'server' // <-- ESTA ES LA LÍNEA MÁGICA QUE FALTABA
});
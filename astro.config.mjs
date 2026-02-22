import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [tailwind()],

  // <-- ESTA ES LA LÍNEA MÁGICA QUE FALTABA
  output: 'server',

  vite: {
    plugins: [tailwindcss()]
  }
});
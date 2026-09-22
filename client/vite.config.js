/**
 * File: client/vite.config.js
 * Description:
 *   Vite Build Tool & Development Server Configuration.
 *   - Integrates React plugin and Tailwind CSS v4 Vite compiler plugin.
 *   - Configures local development server on port 5173 with network host binding.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true
  }
})

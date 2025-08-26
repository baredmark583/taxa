import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This replaces process.env.API_KEY in your code with the value of
    // the VITE_API_KEY environment variable during the build process.
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  }
})

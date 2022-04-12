import { defineConfig } from 'vite';
import { splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), checker({ typescript: true }), splitVendorChunkPlugin()],
    build: {
        sourcemap: true,
    },
});

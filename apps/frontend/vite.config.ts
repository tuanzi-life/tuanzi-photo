import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueRouter from "vue-router/vite";
import ui from "@nuxt/ui/vite";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  server: {
    host: "0.0.0.0",
    port: 4011,
    proxy: {
      "/api": "http://127.0.0.1:4010",
    },
  },
  build: {
    cssMinify: "esbuild",
    reportCompressedSize: false,
  },
  plugins: [
    vueRouter({
      dts: "src/route-map.d.ts",
      watch: command === "serve",
    }),
    vue(),
    ui({
      ui: {
        colors: {
          primary: "green",
          neutral: "zinc",
        },
      },
    }),
  ],
}));

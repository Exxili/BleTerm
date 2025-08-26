import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";

// optional: create electron/hci-stub.ts exporting an empty object if you want the alias
// export default {};

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "electron/main.ts",
        // ⬇️ add per-main Vite options here
        vite: {
          build: {
            rollupOptions: {
              // keep @abandonware/* (noble + backends) external so Node resolves at runtime
              external: [/^@abandonware\/.*/, "ws"],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, "electron/preload.ts"),
        // (optional) if you also need externals in preload, add a vite:{} block here too
        // vite: { build: { rollupOptions: { external: [] } } }
      },
      renderer: process.env.NODE_ENV === "test" ? undefined : {},
    }),
  ],
});

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const disableHmr = env.DISABLE_HMR === "true";

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },

      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },

    server: {
      host: "0.0.0.0",
      port: 3000,

      hmr: disableHmr
        ? false
        : {
            protocol: "wss",
            clientPort: 443,
          },
    },
  };
});

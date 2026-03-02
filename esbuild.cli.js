// esbuild.cli.js — 单独打包 compile-prompt CLI 工具
const esbuild = require("esbuild");

const production = process.argv.includes("--production");

esbuild
  .build({
    entryPoints: ["scripts/compile-prompt.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node18",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    // 输出到 dist/cli/compile-prompt.js，与扩展产物隔离
    outfile: "dist/cli/compile-prompt.js",
    // 注入 banner，保留 shebang（esbuild 打包后 shebang 会丢失）
    banner: {
      js: "#!/usr/bin/env node",
    },
  })
  .then(() => {
    console.log("[cli] compile-prompt built → dist/cli/compile-prompt.js");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

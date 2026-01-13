/**
 * 构建 registry JSON 文件
 * 输出到 dist/ 目录
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { registry } from "../src/registry.js";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function build() {
  console.log("🏗️  Building registry...\n");

  ensureDir(DIST);

  // 遍历所有框架和样式
  for (const [framework, styles] of Object.entries(registry)) {
    for (const [style, items] of Object.entries(styles)) {
      const outDir = join(DIST, framework, style);
      ensureDir(outDir);

      for (const item of items) {
        // 读取文件内容
        const filesWithContent = item.files.map((file) => {
          const filePath = join(SRC, file.path);
          const content = readFileSync(filePath, "utf-8");
          return { ...file, content };
        });

        // 输出 JSON
        const output = {
          name: item.name,
          type: item.type,
          description: item.description,
          files: filesWithContent,
          dependencies: item.dependencies || [],
          devDependencies: item.devDependencies || [],
          registryDependencies: item.registryDependencies || [],
        };

        const outPath = join(outDir, `${item.name}.json`);
        writeFileSync(outPath, JSON.stringify(output, null, 2));
        console.log(`  ✅ ${framework}/${style}/${item.name}.json`);
      }
    }
  }

  // 生成 index.json
  const index = {
    frameworks: Object.keys(registry),
    items: Object.fromEntries(
      Object.entries(registry).map(([fw, styles]) => [
        fw,
        Object.fromEntries(
          Object.entries(styles).map(([style, items]) => [
            style,
            items.map((i) => ({ name: i.name, type: i.type, description: i.description })),
          ])
        ),
      ])
    ),
  };

  writeFileSync(join(DIST, "index.json"), JSON.stringify(index, null, 2));
  console.log("\n✅ Build complete!");
}

build();

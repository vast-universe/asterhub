/**
 * 创建官方命名空间和种子数据
 * 运行: npx tsx scripts/seed-official.ts
 */
import { sql } from "@vercel/postgres";
import path from "path";
import fs from "fs";

// 手动加载 .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

async function seedOfficial() {
  console.log("🌱 创建官方命名空间...\n");

  try {
    // 1. 检查是否已存在
    const existing = await sql`
      SELECT id FROM namespaces WHERE name = 'asterhub'
    `;

    if (existing.rows.length > 0) {
      console.log("✅ 官方命名空间已存在 (ID:", existing.rows[0].id, ")");
      return existing.rows[0].id;
    }

    // 2. 创建官方命名空间 (不关联用户，作为系统命名空间)
    const result = await sql`
      INSERT INTO namespaces (name, description, verified)
      VALUES ('asterhub', 'AsterHub 官方组件库', true)
      RETURNING id
    `;

    const namespaceId = result.rows[0].id;
    console.log(`✅ 创建命名空间: asterhub (ID: ${namespaceId})`);

    return namespaceId;
  } catch (error) {
    console.error("❌ 创建命名空间失败:", error);
    throw error;
  }
}

async function seedComponents(namespaceId: number) {
  console.log("\n📦 导入官方组件...\n");

  // 读取构建产物
  const distDir = path.resolve(process.cwd(), "../../packages/registry/dist");
  const indexPath = path.join(distDir, "index.json");

  if (!fs.existsSync(indexPath)) {
    console.log("⚠️  找不到 dist/index.json，请先运行 registry build");
    console.log("   cd ../registry && npx asterhub registry build");
    return;
  }

  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  // 处理组件
  const types = [
    { key: "components", type: "ui" },
    { key: "hooks", type: "hook" },
    { key: "lib", type: "lib" },
    { key: "configs", type: "config" },
  ];

  for (const { key, type } of types) {
    const items = index[key] || [];
    for (const item of items) {
      try {
        // 读取组件 JSON
        let jsonPath: string;
        if (type === "ui" && item.style) {
          jsonPath = path.join(distDir, key, item.style, item.name, "latest.json");
        } else {
          jsonPath = path.join(distDir, key, item.name, "latest.json");
        }

        if (!fs.existsSync(jsonPath)) {
          console.log(`⚠️  跳过 ${type}:${item.name} (文件不存在)`);
          continue;
        }

        const content = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

        // 检查是否已存在
        const existing = await sql`
          SELECT id FROM registry_items 
          WHERE namespace_id = ${namespaceId} 
          AND name = ${item.name} 
          AND type = ${type}
        `;

        if (existing.rows.length > 0) {
          console.log(`⏭️  跳过 ${type}:${item.name} (已存在)`);
          continue;
        }

        // 插入资源
        const itemResult = await sql`
          INSERT INTO registry_items (
            namespace_id, name, type, style, description, 
            latest_version, is_official
          )
          VALUES (
            ${namespaceId}, 
            ${item.name}, 
            ${type}, 
            ${item.style || null},
            ${item.description || ""}, 
            ${content.version},
            true
          )
          RETURNING id
        `;

        const itemId = itemResult.rows[0].id;

        // 插入版本 (r2_path 暂时用本地路径，实际应该上传到 R2)
        const r2Path = `asterhub/${type}/${item.name}/${content.version}.json`;
        
        await sql`
          INSERT INTO registry_versions (item_id, version, r2_path, file_size)
          VALUES (
            ${itemId}, 
            ${content.version}, 
            ${r2Path},
            ${JSON.stringify(content).length}
          )
        `;

        console.log(`✅ ${type}:${item.name}@${content.version}`);
      } catch (error) {
        console.error(`❌ 导入 ${type}:${item.name} 失败:`, error);
      }
    }
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("AsterHub 官方组件种子数据");
  console.log("=".repeat(50));

  const namespaceId = await seedOfficial();
  await seedComponents(namespaceId);

  console.log("\n✅ 完成!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

/**
 * 运行数据库迁移
 * npx tsx scripts/run-migrate.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { createPool } from "@vercel/postgres";

// 手动加载 .env.local
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

async function migrate() {
  const sqlFile = readFileSync(join(__dirname, "migrate.sql"), "utf-8");
  
  // 更智能的分割：只在行首的分号处分割
  const statements: string[] = [];
  let current = "";
  
  for (const line of sqlFile.split("\n")) {
    const trimmed = line.trim();
    // 跳过注释和空行
    if (trimmed.startsWith("--") || trimmed === "") {
      continue;
    }
    current += line + "\n";
    // 如果行以分号结尾，认为是一条完整语句
    if (trimmed.endsWith(";")) {
      statements.push(current.trim());
      current = "";
    }
  }

  console.log(`执行 ${statements.length} 条 SQL 语句...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.split("\n")[0].slice(0, 60);
    try {
      await pool.query(statement);
      console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes("already exists")) {
        console.log(`○ [${i + 1}/${statements.length}] ${preview}... (已存在)`);
      } else {
        console.error(`✗ [${i + 1}/${statements.length}] ${preview}...`);
        console.error(`   ${err.message}`);
      }
    }
  }

  await pool.end();
  console.log("\n迁移完成!");
}

migrate().catch(console.error);

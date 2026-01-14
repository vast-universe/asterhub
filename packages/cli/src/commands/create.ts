/**
 * create 命令 - 创建新项目 (仅支持 Next.js)
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import ora from "ora";
import prompts from "prompts";
import { logger, fs } from "../lib";
import type { CreateOptions } from "../types";

export async function create(projectName: string | undefined, options: CreateOptions = {}): Promise<void> {
  const spinner = ora();

  logger.header("🚀", "AsterHub Create - 创建新项目");

  // 1. 获取项目名称
  if (!projectName) {
    const answer = await prompts({
      type: "text",
      name: "projectName",
      message: "项目名称:",
      initial: "my-app",
    });
    projectName = answer.projectName;
  }

  if (!projectName) {
    logger.warn("已取消");
    return;
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  // 检查目录是否存在
  if (await fs.exists(targetDir)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `目录 ${projectName} 已存在，是否覆盖？`,
      initial: false,
    });

    if (!overwrite) {
      logger.warn("已取消");
      return;
    }

    await fs.remove(targetDir);
  }

  logger.newline();

  // 2. 创建 Next.js 项目
  await createNextProject(projectName, targetDir, spinner);

  // 3. 输出结果
  logger.newline();
  logger.success("项目创建成功！");
  logger.newline();
  logger.log(`  cd ${projectName}`);
  logger.log("  npm run dev");
  logger.newline();
  logger.dim("提示: 运行 npx asterhub add button 添加组件");
  logger.newline();
}

async function createNextProject(
  projectName: string,
  targetDir: string,
  spinner: ReturnType<typeof ora>
): Promise<void> {
  // 1. 查找模板目录
  spinner.start("查找模板...");

  // 获取 CLI 包的根目录，然后找到 templates/next
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  
  // 尝试多个可能的模板路径
  const possiblePaths = [
    path.resolve(__dirname, "../../templates/next"),        // 从 dist: cli/dist -> cli/../templates/next
    path.resolve(__dirname, "../../../templates/next"),     // 从 src: cli/src/commands -> templates/next
    path.resolve(__dirname, "../../../../packages/templates/next"), // 更深层级
  ];

  let templateDir: string | null = null;
  for (const p of possiblePaths) {
    if (await fs.exists(p)) {
      templateDir = p;
      break;
    }
  }

  if (!templateDir) {
    spinner.fail("找不到 Next.js 模板");
    logger.error("请确保 packages/templates/next 目录存在");
    return;
  }

  spinner.succeed("模板找到");

  // 2. 复制模板
  spinner.start("复制模板文件...");

  try {
    await fs.ensureDir(targetDir);
    await copyTemplateFiles(templateDir, targetDir, projectName);
    spinner.succeed("模板复制完成");
  } catch (error) {
    spinner.fail("模板复制失败");
    logger.error((error as Error).message);
    return;
  }

  // 3. 更新 package.json 中的项目名称
  spinner.start("配置项目...");

  try {
    const pkgPath = path.join(targetDir, "package.json");
    const pkg = await fs.readJson<Record<string, unknown>>(pkgPath);
    if (pkg) {
      pkg.name = projectName;
      await fs.writeJson(pkgPath, pkg);
    }

    // 创建 asterhub.json 配置文件
    await fs.writeJson(path.join(targetDir, "asterhub.json"), {
      $schema: "https://asterhub.dev/schema/asterhub.json",
      style: "tailwind",
      framework: "next",
      aliases: {
        components: "@/components",
        hooks: "@/hooks",
        lib: "@/lib",
      },
      installed: {
        ui: {},
        hook: {},
        lib: {},
        config: {},
      },
    });

    spinner.succeed("项目配置完成");
  } catch (error) {
    spinner.warn("配置更新失败");
  }

  // 4. 安装依赖
  spinner.start("安装依赖...");

  try {
    execSync("npm install", {
      cwd: targetDir,
      stdio: "pipe",
    });
    spinner.succeed("依赖安装完成");
  } catch {
    spinner.warn("依赖安装失败，请手动运行 npm install");
  }
}

async function copyTemplateFiles(
  srcDir: string,
  destDir: string,
  projectName: string
): Promise<void> {
  const files = await fs.listDir(srcDir);

  for (const file of files) {
    // 跳过 node_modules 和 .next
    if (file === "node_modules" || file === ".next" || file === ".git") {
      continue;
    }

    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    const stat = await fs.stat(srcPath);
    if (stat?.isDirectory()) {
      await fs.ensureDir(destPath);
      await copyTemplateFiles(srcPath, destPath, projectName);
    } else {
      // 复制文件，如果是 package.json 则替换项目名
      if (file === "package.json") {
        const content = await fs.readText(srcPath);
        if (content) {
          const updated = content.replace(/\{\{name\}\}/g, projectName);
          await fs.writeText(destPath, updated);
        }
      } else {
        await fs.copy(srcPath, destPath);
      }
    }
  }
}

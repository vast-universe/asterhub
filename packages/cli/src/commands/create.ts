/**
 * create 命令 - 创建新项目
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import type { Ora } from "ora";
import ora from "ora";
import prompts from "prompts";
import { logger, fs } from "../lib";

interface CreateOptions {
  framework?: string;
  yes?: boolean;
}

// 获取本地模板路径
function getLocalTemplatesPath(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // cli/dist -> cli -> packages -> templates
  return path.resolve(__dirname, "../../templates");
}

export async function create(
  projectName: string | undefined,
  options: CreateOptions = {}
): Promise<void> {
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

  // 2. 选择框架
  let framework = options.framework || "next";

  if (!options.yes && !options.framework) {
    const answer = await prompts({
      type: "select",
      name: "framework",
      message: "选择框架:",
      choices: [
        { title: "Next.js", value: "next" },
        { title: "Expo (即将支持)", value: "expo", disabled: true },
        { title: "Nuxt (即将支持)", value: "nuxt", disabled: true },
      ],
      initial: 0,
    });

    if (!answer.framework) {
      logger.warn("已取消");
      return;
    }

    framework = answer.framework;
  }

  logger.newline();

  // 3. 创建项目
  if (framework === "next") {
    await createNextProject(projectName, targetDir, spinner);
  } else {
    logger.error(`框架 ${framework} 暂不支持`);
    return;
  }

  // 4. 输出结果
  logger.newline();
  logger.success("项目创建成功！");
  logger.newline();
  logger.log(`  cd ${projectName}`);
  logger.log("  npm run dev");
  logger.newline();
  logger.dim("提示: 运行 npx asterhub add button 添加组件");
  logger.newline();
}

async function copyTemplateFiles(
  srcDir: string,
  destDir: string
): Promise<void> {
  const files = await fs.listDir(srcDir);

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    const fileStat = await fs.stat(srcPath);
    if (fileStat?.isDirectory()) {
      await fs.ensureDir(destPath);
      await copyTemplateFiles(srcPath, destPath);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

/**
 * 创建 Next.js 项目
 */
async function createNextProject(
  projectName: string,
  targetDir: string,
  spinner: Ora
): Promise<void> {
  const templatesPath = getLocalTemplatesPath();
  const nextTemplatePath = path.join(templatesPath, "next");

  // 检查本地模板是否存在
  if (!(await fs.exists(nextTemplatePath))) {
    logger.error(
      "Next.js 模板不存在，请确保 packages/templates/next 目录存在"
    );
    return;
  }

  // 1. 复制模板
  spinner.start("复制 Next.js 模板...");
  try {
    await fs.ensureDir(targetDir);
    await copyTemplateFiles(nextTemplatePath, targetDir);

    // 排除不需要的文件
    const excludeFiles = ["node_modules", ".next", ".git", "template.json"];
    for (const file of excludeFiles) {
      const filePath = path.join(targetDir, file);
      if (await fs.exists(filePath)) {
        await fs.remove(filePath);
      }
    }

    spinner.succeed("模板复制完成");
  } catch (error) {
    spinner.fail("模板复制失败");
    throw error;
  }

  // 2. 替换 package.json 中的 {{name}}
  spinner.start("配置项目...");
  try {
    const pkgPath = path.join(targetDir, "package.json");
    let pkgContent = await fs.readText(pkgPath);
    if (pkgContent) {
      pkgContent = pkgContent.replace(/\{\{name\}\}/g, projectName);
      await fs.writeText(pkgPath, pkgContent);
    }
    spinner.succeed("项目配置完成");
  } catch {
    spinner.warn("项目配置失败");
  }

  // 3. 创建 asterhub.json
  spinner.start("创建 asterhub.json...");
  try {
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
    spinner.succeed("asterhub.json 创建完成");
  } catch {
    spinner.warn("asterhub.json 创建失败");
  }

  // 4. 安装依赖
  spinner.start("安装依赖...");
  try {
    execSync("npm install", { cwd: targetDir, stdio: "pipe" });
    spinner.succeed("依赖安装完成");
  } catch {
    spinner.warn("依赖安装失败，请手动运行 npm install");
  }
}

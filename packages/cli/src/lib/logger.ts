/**
 * 日志工具 - 统一的控制台输出
 */
import chalk from "chalk";

export const logger = {
  // 信息
  info: (message: string) => {
    console.log(chalk.cyan(message));
  },

  // 成功
  success: (message: string) => {
    console.log(chalk.green(`✔ ${message}`));
  },

  // 警告
  warn: (message: string) => {
    console.log(chalk.yellow(`⚠ ${message}`));
  },

  // 错误
  error: (message: string) => {
    console.log(chalk.red(`✖ ${message}`));
  },

  // 调试（仅在 DEBUG 模式下输出）
  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(chalk.dim(`[debug] ${message}`));
    }
  },

  // 普通输出
  log: (message: string) => {
    console.log(message);
  },

  // 灰色提示
  dim: (message: string) => {
    console.log(chalk.dim(message));
  },

  // 空行
  newline: () => {
    console.log();
  },

  // 标题
  title: (message: string) => {
    console.log(chalk.bold(message));
  },

  // 列表项
  item: (label: string, value: string) => {
    console.log(`  ${chalk.white(label)}: ${chalk.dim(value)}`);
  },

  // 带图标的标题
  header: (icon: string, message: string) => {
    console.log(chalk.cyan(`\n${icon} ${message}\n`));
  },

  // 分隔线
  divider: (char = "─", length = 50) => {
    console.log(chalk.dim(char.repeat(length)));
  },

  // 表格行
  row: (cols: string[], widths: number[]) => {
    const formatted = cols.map((col, i) => col.padEnd(widths[i] || 20)).join(" ");
    console.log(`  ${formatted}`);
  },
};

export default logger;

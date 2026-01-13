#!/usr/bin/env node
/**
 * Aster CLI - 跨框架组件库管理工具
 */
import { Command } from "commander";
import {
  // create,  // TODO: v2 - 创建项目功能
  init,
  add,
  remove,
  update,
  list,
  search,
  diff,
  info,
  view,
  login,
  logout,
  whoami,
  tokenList,
  tokenCreate,
  tokenRevoke,
  namespaceCreate,
  namespaceList,
  namespaceDelete,
  registryCreate,
  registryBuild,
  registryPublish,
  recover,
} from "./commands";

const program = new Command();

program
  .name("aster")
  .description("跨框架组件库 CLI - 安装、管理和发布 UI 组件、Hooks、工具函数")
  .version("0.1.0");

// ============ 项目命令 ============

// TODO: v2 - 创建项目功能
// program
//   .command("create")
//   .description("创建新项目")
//   .argument("[name]", "项目名称")
//   .option("-f, --framework <framework>", "框架 (expo/nextjs)")
//   .option("-s, --starter <starter>", "模板 (minimal/standard/full)")
//   .option("-y, --yes", "使用默认配置")
//   .action(create);

program
  .command("init")
  .description("初始化 Aster 配置")
  .action(init);

// ============ 组件命令 ============

program
  .command("add")
  .description("添加组件/hooks/lib/config")
  .argument("<items...>", "资源名称")
  .option("-f, --force", "覆盖已存在的文件")
  .option("--skip-security", "跳过安全检查")
  .action(add);

program
  .command("remove")
  .description("删除已安装的资源")
  .argument("[items...]", "资源名称")
  .option("-y, --yes", "跳过确认")
  .action(remove);

program
  .command("update")
  .description("更新已安装的资源")
  .argument("[items...]", "资源名称")
  .option("-a, --all", "更新所有")
  .option("-f, --force", "强制更新")
  .action(update);

program
  .command("list")
  .description("列出可用/已安装的资源")
  .option("-i, --installed", "列出已安装")
  .option("-c, --configs", "只列出配置")
  .option("--hooks", "只列出 hooks")
  .option("--lib", "只列出工具函数")
  .action(list);

program
  .command("search")
  .description("搜索资源")
  .argument("[query]", "搜索关键词")
  .option("-t, --type <type>", "资源类型")
  .option("-n, --namespace <ns>", "命名空间")
  .action(search);

program
  .command("diff")
  .description("检查资源更新")
  .argument("[item]", "资源名称")
  .action(diff);

program
  .command("view")
  .description("预览资源代码")
  .argument("<item>", "资源名称")
  .option("-f, --file <file>", "指定文件")
  .action(view);

program
  .command("info")
  .description("显示配置信息")
  .action(info);

// ============ 认证命令 ============

program.command("login").description("登录 AsterHub").action(login);
program.command("logout").description("退出登录").action(logout);
program.command("whoami").description("查看当前用户").action(whoami);

// ============ Token 命令 ============

const token = program.command("token").description("管理 API Token");

token.command("list").description("列出所有 Token").action(tokenList);

token
  .command("create")
  .description("创建新 Token")
  .option("-n, --name <name>", "Token 名称")
  .option("-s, --scope <scopes>", "权限范围 (逗号分隔)")
  .action(tokenCreate);

token
  .command("revoke")
  .description("撤销 Token")
  .argument("<id>", "Token ID")
  .action(tokenRevoke);

// ============ 命名空间命令 ============

const namespace = program.command("namespace").description("管理命名空间");

namespace
  .command("create")
  .description("创建命名空间")
  .argument("<name>", "名称")
  .action(namespaceCreate);

namespace
  .command("list")
  .description("列出我的命名空间")
  .action(namespaceList);

namespace
  .command("delete")
  .description("删除命名空间")
  .argument("<name>", "名称")
  .action(namespaceDelete);

// ============ Registry 命令 ============

const registry = program.command("registry").description("创建和发布组件库");

registry
  .command("create")
  .description("创建 Registry 项目")
  .argument("[name]", "项目名称")
  .option("-n, --namespace <ns>", "命名空间")
  .action(registryCreate);

registry
  .command("build")
  .description("构建 Registry")
  .option("-w, --watch", "监听变化")
  .action(registryBuild);

registry
  .command("publish")
  .description("发布 Registry")
  .option("-n, --namespace <ns>", "命名空间")
  .option("--dry-run", "预览发布")
  .action(registryPublish);

// ============ 其他命令 ============

program
  .command("recover")
  .description("恢复未完成的安装事务")
  .action(recover);

program.parse();

import { NextResponse } from "next/server";

// 框架元数据 - 后续可以迁移到数据库
const frameworkMeta = {
  expo: {
    name: "expo",
    displayName: "Expo (React Native)",
    styles: [
      { name: "nativewind", displayName: "NativeWind", description: "Tailwind CSS for React Native" },
      { name: "stylesheet", displayName: "StyleSheet", description: "React Native 原生样式" },
    ],
    configs: [
      { name: "nativewind", displayName: "NativeWind", description: "Tailwind CSS 配置" },
      { name: "zustand", displayName: "Zustand", description: "轻量级状态管理" },
      { name: "axios", displayName: "Axios", description: "HTTP 请求库" },
      { name: "tanstack", displayName: "TanStack Query", description: "数据请求和缓存" },
      { name: "i18n", displayName: "i18n", description: "国际化支持" },
      { name: "toast", displayName: "Toast", description: "消息提示" },
      { name: "form", displayName: "React Hook Form", description: "表单处理" },
      { name: "lint", displayName: "ESLint + Prettier", description: "代码规范" },
    ],
  },
};

/**
 * GET /api/meta?framework=expo
 * 获取框架元数据 (样式选项、状态管理选项等)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const framework = searchParams.get("framework");

  if (!framework || !(framework in frameworkMeta)) {
    return NextResponse.json(
      { 
        error: "Invalid framework",
        availableFrameworks: Object.keys(frameworkMeta),
      },
      { status: 400 }
    );
  }

  return NextResponse.json(frameworkMeta[framework as keyof typeof frameworkMeta]);
}

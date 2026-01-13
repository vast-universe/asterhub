import { NextResponse } from "next/server";

// 预设配置 - 后续可以迁移到数据库
const presets = [
  {
    name: "expo-starter",
    displayName: "Expo Starter",
    description: "基础 Expo 项目模板，包含 NativeWind 样式",
    framework: "expo",
    style: "nativewind",
    components: ["button", "input", "card"],
    configs: ["nativewind"],
  },
  {
    name: "expo-full",
    displayName: "Expo Full Stack",
    description: "完整 Expo 项目模板，包含状态管理、网络请求等",
    framework: "expo",
    style: "nativewind",
    components: ["button", "input", "card", "modal", "toast", "loading"],
    configs: ["nativewind", "zustand", "axios", "tanstack"],
  },
];

/**
 * GET /api/presets
 * GET /api/presets?name=expo-starter
 * 获取预设列表或单个预设
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  // 获取单个预设
  if (name) {
    const preset = presets.find((p) => p.name === name);
    if (!preset) {
      return NextResponse.json(
        { error: `Preset "${name}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(preset);
  }

  // 获取所有预设
  return NextResponse.json(presets);
}

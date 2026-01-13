import { NextResponse } from "next/server";
import { searchRegistry } from "@/lib/db/registry";

type Framework = "expo" | "next" | "vue" | "nuxt";
type Style = "nativewind" | "stylesheet" | "tailwind" | "css" | "unocss";

const validFrameworks: Framework[] = ["expo", "next", "vue", "nuxt"];
const frameworkStyles: Record<Framework, Style[]> = {
  expo: ["nativewind", "stylesheet"],
  next: ["tailwind", "css"],
  vue: ["tailwind", "unocss", "css"],
  nuxt: ["tailwind", "unocss", "css"],
};

/**
 * GET /api/r?framework=expo&type=config
 * GET /api/r?framework=expo&type=ui&style=nativewind
 * 从数据库获取 registry 资源列表
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const framework = searchParams.get("framework") as Framework | null;
  const type = searchParams.get("type") || "ui"; // config | ui
  const style = searchParams.get("style") as Style | null;

  // 验证 framework 参数
  if (!framework) {
    return NextResponse.json(
      {
        error: "Missing framework parameter",
        frameworks: validFrameworks,
      },
      { status: 400 }
    );
  }

  if (!validFrameworks.includes(framework)) {
    return NextResponse.json(
      { error: `Invalid framework. Valid: ${validFrameworks.join(", ")}` },
      { status: 400 }
    );
  }

  // 获取配置列表
  if (type === "config") {
    const items = await searchRegistry({
      framework,
      type: "registry:config",
    });
    return NextResponse.json(
      items.map((item) => ({
        name: item.name,
        type: item.type,
        description: item.description,
      }))
    );
  }

  // 获取组件列表
  if (!style) {
    const styles = frameworkStyles[framework];
    return NextResponse.json(
      {
        error: "Missing style parameter for components",
        styles,
      },
      { status: 400 }
    );
  }

  const validStyles = frameworkStyles[framework];
  if (!validStyles.includes(style)) {
    return NextResponse.json(
      { error: `Invalid style for ${framework}. Valid: ${validStyles.join(", ")}` },
      { status: 400 }
    );
  }

  const items = await searchRegistry({
    framework,
    style,
    type: "registry:ui",
  });

  return NextResponse.json(
    items.map((item) => ({
      name: item.name,
      type: item.type,
      description: item.description,
    }))
  );
}

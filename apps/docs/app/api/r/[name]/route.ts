import { NextResponse } from "next/server";
import { getRegistryItem } from "@/lib/db/registry";

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
 * GET /api/r/[name]?framework=expo&type=config
 * GET /api/r/[name]?framework=expo&type=ui&style=nativewind
 * 从数据库获取单个 registry 资源
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { searchParams } = new URL(request.url);
  const framework = searchParams.get("framework") as Framework | null;
  const type = searchParams.get("type") || "ui";
  const style = searchParams.get("style") as Style | null;

  // 验证 framework 参数
  if (!framework) {
    return NextResponse.json(
      { error: "Missing framework parameter", frameworks: validFrameworks },
      { status: 400 }
    );
  }

  if (!validFrameworks.includes(framework)) {
    return NextResponse.json(
      { error: `Invalid framework. Valid: ${validFrameworks.join(", ")}` },
      { status: 400 }
    );
  }

  // 获取配置
  if (type === "config") {
    const item = await getRegistryItem({
      name,
      framework,
      type: "registry:config",
    });

    if (!item) {
      return NextResponse.json(
        { error: `Config "${name}" not found for framework "${framework}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  }

  // 获取组件
  if (!style) {
    return NextResponse.json(
      { error: "Missing style parameter", styles: frameworkStyles[framework] },
      { status: 400 }
    );
  }

  const validStyles = frameworkStyles[framework];
  if (!validStyles.includes(style)) {
    return NextResponse.json(
      { error: `Invalid style. Valid: ${validStyles.join(", ")}` },
      { status: 400 }
    );
  }

  const item = await getRegistryItem({
    name,
    framework,
    style,
    type: "registry:ui",
  });

  if (!item) {
    return NextResponse.json(
      { error: `Component "${name}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(item);
}

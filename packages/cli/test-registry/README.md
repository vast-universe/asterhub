# test-registry

AsterHub 组件库项目。

## 快速开始

```bash
# 安装依赖
npm install

# 构建
npm run build

# 发布
npx asterhub login
npm run publish:registry
```

## 目录结构

```
src/
├── components/           # UI 组件
│   └── tailwind/
│       └── button.tsx
├── hooks/                # Hooks
│   └── use-debounce.ts
└── lib/                  # 工具函数
    └── utils.ts
```

## 添加新组件

1. 在 `src/components/tailwind/` 下创建组件文件
2. 在 `registry.config.ts` 中注册组件
3. 运行 `npm run build` 构建
4. 运行 `npm run publish:registry` 发布

## 文档

- [AsterHub 文档](https://asterhub.dev/docs)
- [创建组件指南](https://asterhub.dev/docs/registry)

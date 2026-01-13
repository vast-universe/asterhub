# @asterhub/registry

AsterHub 官方组件库源码。

## 结构

```
src/
├── expo/
│   ├── nativewind/     # NativeWind 样式组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── loading.tsx
│   └── lib/
│       └── utils.ts
└── registry.ts         # 组件元数据
```

## 构建

```bash
pnpm build
```

输出到 `dist/` 目录，生成 JSON 文件供 CLI 下载。

## 发布

构建后的 JSON 文件可以：
1. 上传到 R2 存储
2. 通过 `asterhub publish` 发布到 registry 服务

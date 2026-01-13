# @asterhub/templates

AsterHub 官方项目模板。

## 模板

### next

Next.js 15 + Tailwind CSS 基础模板。

```bash
asterhub create my-app --template next
```

## 变量替换

模板文件中的 `{{name}}` 会被替换为项目名称。

## 添加新模板

1. 在 `templates/` 下创建模板目录
2. 添加 `template.json` 配置文件
3. 使用 `{{variable}}` 语法定义变量

# 如何编写 Skill

## Skill 的基本结构

一个 skill 通常包含以下文件：

```
my-skill/
├── SKILL.md          # 技能的主要文档（必需）
├── skill.json        # 技能配置文件（可选）
├── examples/         # 示例文件（可选）
└── templates/        # 模板文件（可选）
```

## 1. SKILL.md 文件格式

### Frontmatter（必需）

```yaml
---
name: skill-name
description: 简短描述，说明何时使用此技能
---
```

### 内容结构

````markdown
# 技能名称

## 概述

技能的主要功能和用途。

## 使用场景

- 场景1：当用户提到...
- 场景2：当需要处理...

## 具体用法

详细的指令和示例。

## 示例

```code
示例代码或命令
```
````

## 最佳实践

使用建议和注意事项。

## 参考

相关文档链接。

````

## 2. skill.json 配置文件（可选）

```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "技能描述",
  "author": "作者名",
  "keywords": ["keyword1", "keyword2"],
  "files": ["SKILL.md", "examples/*"],
  "dependencies": [],
  "compatibility": {
    "agents": ["claude", "codex"],
    "minVersion": "1.0.0"
  }
}
````

## 3. 编写技巧

### 清晰的指令

- 使用具体的示例
- 包含常见用例
- 提供逐步指导

### 触发关键词

在 description 中包含关键词，帮助 AI 识别何时使用此技能。

### 结构化内容

使用清晰的标题和列表，便于 AI 理解和引用。

## 4. 示例：TypeScript Skill

**SKILL.md:**

````markdown
---
name: typescript-helper
description: Help with TypeScript code, types, interfaces, and TypeScript-specific patterns. Use when user mentions TypeScript, .ts files, or needs type definitions.
---

# TypeScript Helper Skill

## Overview

This skill provides guidance for TypeScript development including type definitions, interfaces, generics, and TypeScript best practices.

## Basic Types

```typescript
// Primitive types
let name: string = "John"
let age: number = 30
let isActive: boolean = true

// Arrays
let numbers: number[] = [1, 2, 3]
let strings: Array<string> = ["a", "b", "c"]

// Tuples
let tuple: [string, number] = ["hello", 42]
```
````

## 完整示例

查看 `skill-example/my-skill/` 目录中的完整示例。

## 安装和使用

### 对于 Claude Code

```bash
# 复制到 .claude 目录
cp -r my-skill ~/.claude/skills/
```

### 对于 Codex CLI

```bash
# 复制到 skills 目录
cp -r my-skill ~/.codex/skills/
```

## 测试技能

1. 安装技能到相应目录
2. 重启 AI 代理或重新加载技能
3. 使用技能相关的关键词进行测试
4. 验证 AI 是否正确引用技能内容

## 最佳实践

1. **保持专注**：每个技能解决一个特定领域的问题
2. **提供示例**：包含实际的代码示例
3. **更新维护**：定期更新技能内容
4. **测试验证**：确保技能在实际场景中有效

## 资源

- [Agent Skills 规范](https://agentskills.io/specification)
- [Claude Skills 文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Obsidian Skills 示例](https://github.com/kepano/obsidian-skills)

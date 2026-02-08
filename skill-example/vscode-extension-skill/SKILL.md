---
name: vscode-extension-developer
description: Help with VS Code extension development, including extension structure, API usage, publishing, and debugging. Use when user mentions VS Code extensions, .vsix files, or extension development.
---

# VS Code Extension Developer Skill

## Overview

This skill provides comprehensive guidance for VS Code extension development, from project setup to publishing.

## Project Structure

### Basic Structure

```
my-extension/
├── .vscode/                 # VS Code configuration
│   ├── launch.json         # Debug configurations
│   └── tasks.json          # Build tasks
├── src/                    # Source code
│   ├── extension.ts        # Main entry point
│   └── commands/           # Command implementations
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
├── webpack.config.js       # Bundling configuration (optional)
└── README.md               # Extension documentation
```

### package.json Essentials

```json
{
	"name": "my-extension",
	"displayName": "My Extension",
	"description": "Description of my extension",
	"version": "1.0.0",
	"publisher": "your-name",
	"engines": {
		"vscode": "^1.60.0"
	},
	"categories": ["Other"],
	"activationEvents": ["onCommand:myExtension.helloWorld", "onLanguage:typescript"],
	"main": "./dist/extension.js",
	"contributes": {
		"commands": [
			{
				"command": "myExtension.helloWorld",
				"title": "Hello World"
			}
		],
		"menus": {
			"commandPalette": [
				{
					"command": "myExtension.helloWorld",
					"when": "editorLangId == typescript"
				}
			]
		}
	}
}
```

## Core Concepts

### Activation Events

```json
"activationEvents": [
  "*",                       // Always activate
  "onCommand:extension.command",
  "onLanguage:javascript",
  "onStartupFinished",       // After VS Code starts
  "onView:explorer",         // When view becomes visible
  "workspaceContains:**/.git"
]
```

### Contribution Points

- `commands` - Register commands
- `menus` - Add items to menus
- `views` - Create custom views
- `configuration` - Extension settings
- `keybindings` - Keyboard shortcuts
- `languages` - Language support

## Extension API Usage

### Basic Extension Setup

```typescript
import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "my-extension" is now active!')

	// Register a command
	const disposable = vscode.commands.registerCommand("myExtension.helloWorld", () => {
		vscode.window.showInformationMessage("Hello World!")
	})

	context.subscriptions.push(disposable)
}

export function deactivate() {
	console.log('Extension "my-extension" is now deactivated.')
}
```

### Common API Patterns

#### Working with Editors

```typescript
// Get active editor
const editor = vscode.window.activeTextEditor
if (editor) {
	const document = editor.document
	const selection = editor.selection

	// Get text at selection
	const text = document.getText(selection)

	// Replace selection
	editor.edit((editBuilder) => {
		editBuilder.replace(selection, "new text")
	})
}
```

#### File System Operations

```typescript
// Read file
const uri = vscode.Uri.file("/path/to/file.txt")
const content = await vscode.workspace.fs.readFile(uri)
const text = Buffer.from(content).toString("utf8")

// Write file
const newContent = Buffer.from("new content", "utf8")
await vscode.workspace.fs.writeFile(uri, newContent)

// List files in workspace
const files = await vscode.workspace.findFiles("**/*.ts")
```

#### Creating Output Channels

```typescript
const outputChannel = vscode.window.createOutputChannel("My Extension")
outputChannel.appendLine("Starting process...")
outputChannel.show() // Make visible to user
```

## Advanced Features

### Webviews

```typescript
class MyWebviewProvider implements vscode.WebviewViewProvider {
	resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.html = `
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Hello from Webview!</h1>
            </body>
            </html>
        `
	}
}

// Register in activate()
const provider = new MyWebviewProvider()
context.subscriptions.push(vscode.window.registerWebviewViewProvider("myExtension.webview", provider))
```

### Tree Views

```typescript
class MyTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		// Return tree items
		return Promise.resolve([new TreeItem("Item 1"), new TreeItem("Item 2")])
	}

	getTreeItem(element: TreeItem): vscode.TreeItem {
		return element
	}
}

class TreeItem extends vscode.TreeItem {
	constructor(label: string) {
		super(label, vscode.TreeItemCollapsibleState.None)
	}
}
```

## Testing and Debugging

### Unit Testing

```typescript
import * as assert from "assert"
import * as vscode from "vscode"

suite("Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.")

	test("Sample test", () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5))
		assert.strictEqual(-1, [1, 2, 3].indexOf(0))
	})
})
```

### Debug Configuration

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "Run Extension",
			"type": "extensionHost",
			"request": "launch",
			"args": ["--extensionDevelopmentPath=${workspaceFolder}"],
			"outFiles": ["${workspaceFolder}/dist/**/*.js"],
			"preLaunchTask": "npm: watch"
		}
	]
}
```

## Publishing

### Package Extension

```bash
# Install vsce
npm install -g @vscode/vsce

# Package extension
vsce package

# Publish to Marketplace
vsce publish
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
name: Release
on:
    push:
        branches: [main]

jobs:
    release:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
            - run: npm ci
            - run: npm run compile
            - run: npm test
            - run: npx @vscode/vsce publish -p ${{ secrets.VSCE_TOKEN }}
```

## Best Practices

### Performance

1. **Lazy activation** - Use specific activation events
2. **Async operations** - Don't block the main thread
3. **Memory management** - Dispose resources properly
4. **Bundle dependencies** - Use webpack for production

### User Experience

1. **Clear error messages** - Help users understand issues
2. **Progress indicators** - Show activity for long operations
3. **Configuration options** - Make extension customizable
4. **Documentation** - Provide clear usage instructions

### Security

1. **Validate inputs** - Sanitize user inputs
2. **Secure communications** - Use HTTPS for external calls
3. **Permission awareness** - Request minimal permissions
4. **Update regularly** - Keep dependencies secure

## Common Issues and Solutions

### Extension Not Activating

- Check `activationEvents` in package.json
- Verify extension is properly installed
- Check VS Code developer console for errors

### Command Not Found

- Ensure command is registered in `contributes.commands`
- Check command ID matches registration
- Verify activation events are triggered

### Performance Problems

- Use webpack for production builds
- Implement lazy loading for large features
- Profile extension with VS Code's performance tools

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Sample Extensions](https://github.com/microsoft/vscode-extension-samples)
- [VS Code Marketplace](https://marketplace.visualstudio.com/)
- [VS Code Dev Blog](https://code.visualstudio.com/blogs)

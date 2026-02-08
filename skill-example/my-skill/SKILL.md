---
name: my-custom-skill
description: A custom skill for working with Roo Code projects. Use when the user mentions Roo Code, VS Code extensions, or AI coding assistants.
---

# My Custom Skill

This skill provides guidance for working with Roo Code projects and VS Code extensions.

## Overview

This skill helps with:

- Understanding Roo Code project structure
- Working with VS Code extension development
- Following best practices for AI coding assistants

## Project Structure

### Key Directories

- `apps/vscode/` - Main VS Code extension
- `packages/` - Shared modules and utilities
- `.roo/` - Roo-specific configurations
- `locales/` - Internationalization files

### Common Commands

```bash
# Development
npm run dev        # Start development server
npm run build      # Build the project
npm run test       # Run tests

# Code quality
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type checking
npm run format     # Format code with Prettier
```

## VS Code Extension Patterns

### Extension Structure

```typescript
// Typical extension structure
export function activate(context: vscode.ExtensionContext) {
	// Register commands
	const disposable = vscode.commands.registerCommand("extension.helloWorld", () => {
		vscode.window.showInformationMessage("Hello World!")
	})

	context.subscriptions.push(disposable)
}

export function deactivate() {
	// Cleanup resources
}
```

### Common VS Code APIs

- `vscode.window` - UI interactions
- `vscode.workspace` - File system operations
- `vscode.commands` - Command registration
- `vscode.languages` - Language features

## Roo Code Specifics

### Modes System

Roo Code supports multiple modes:

- **Code Mode** - Code generation and editing
- **Architect Mode** - System design and architecture
- **Ask Mode** - Question answering
- **Debug Mode** - Debugging assistance
- **Custom Modes** - User-defined modes

### Configuration Files

- `.roomodes` - Mode configurations
- `.roo/commands/` - Custom commands
- `.roo/rules/` - Coding rules and guidelines

## Best Practices

### Code Organization

1. Keep modules small and focused
2. Use TypeScript for type safety
3. Follow the existing project conventions
4. Write comprehensive tests

### Error Handling

```typescript
try {
	// Operation that might fail
	const result = await someAsyncOperation()
	return result
} catch (error) {
	// Log error for debugging
	console.error("Operation failed:", error)

	// Provide user-friendly message
	vscode.window.showErrorMessage(`Failed to complete operation: ${error.message}`)

	// Re-throw if needed
	throw error
}
```

### Testing Patterns

```typescript
// Example test structure
describe("MyFeature", () => {
	beforeEach(() => {
		// Setup before each test
	})

	afterEach(() => {
		// Cleanup after each test
	})

	test("should work correctly", () => {
		// Test implementation
		expect(result).toBe(expected)
	})
})
```

## Common Tasks

### Adding a New Feature

1. Create feature module in appropriate directory
2. Add TypeScript types if needed
3. Implement core functionality
4. Add tests
5. Update documentation
6. Run linting and type checking

### Debugging Tips

- Use VS Code debugger with launch configurations
- Check console output in Developer Tools
- Review telemetry data if enabled
- Test in isolation before integration

## References

- [Roo Code Documentation](https://github.com/rooveterinary/roo-code)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

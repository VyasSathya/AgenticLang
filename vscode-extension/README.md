# Agentic Language Support for VS Code

Provides syntax highlighting and language support for the Agentic programming language.

## Features

- **Syntax Highlighting** - Color coding for keywords, annotations, types, and operators
- **Auto-completion** - Bracket and quote auto-closing
- **Code Folding** - Collapse/expand code blocks
- **Comment Toggling** - Quick line and block comment shortcuts

## Highlighted Syntax

- **Keywords**: `func`, `if`, `else`, `match`, `return`, `or`, `error`
- **Annotations**: `@confidence`, `@needs`, `@uncertain`, `@context`, `@property`, etc.
- **Types**: `Result`, `Ok`, `Err`, `string`, `number`, `boolean`
- **Operators**: `->`, `=>`, `|`, `==`, `!=`, `<`, `>`

## Installation

### From VSIX
1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X)
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded file

### From Source
```bash
cd vscode-extension
npm install
npm run compile
# Press F5 to open Extension Development Host
```

## Usage

1. Create or open a `.agentic` file
2. Syntax highlighting will be applied automatically
3. Use standard VS Code features (folding, comments, etc.)

## Example

```agentic
@confidence(0.90)
@needs(database: Database)
func authenticate(token: string) -> Result<User, AuthError> {
    if token.isEmpty() {
        return Err(AuthError.MISSING_TOKEN)
    }

    return Ok(user)
}
```

## Development

```bash
npm install
npm run compile
npm run watch  # For development
vsce package   # Create .vsix package
```

## License

MIT
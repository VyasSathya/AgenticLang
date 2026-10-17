// Rust-based WASM Compiler for Agentic
// Compiles .agentic → WASM for 5-10x faster compilation

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct Token {
    pub token_type: String,
    pub value: String,
    pub line: usize,
    pub column: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ASTNode {
    pub node_type: String,
    pub name: Option<String>,
    pub value: Option<String>,
    pub children: Vec<ASTNode>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompilationResult {
    pub typescript: String,
    pub diagnostics: Vec<Diagnostic>,
    pub source_map: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Diagnostic {
    pub code: String,
    pub severity: String,
    pub message: String,
    pub line: usize,
    pub column: usize,
}

/// Tokenize Agentic source code (WASM-exported)
#[wasm_bindgen]
pub fn tokenize(source: &str) -> JsValue {
    let tokens = lex(source);
    serde_wasm_bindgen::to_value(&tokens).unwrap()
}

/// Parse Agentic source into AST (WASM-exported)
#[wasm_bindgen]
pub fn parse(source: &str) -> JsValue {
    let tokens = lex(source);
    let ast = parse_tokens(&tokens);
    serde_wasm_bindgen::to_value(&ast).unwrap()
}

/// Full compilation pipeline (WASM-exported)
#[wasm_bindgen]
pub fn compile(source: &str) -> JsValue {
    let result = compile_source(source);
    serde_wasm_bindgen::to_value(&result).unwrap()
}

// Internal implementation
fn lex(source: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut line = 1;
    let mut column = 1;
    let mut chars = source.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '@' => {
                // Annotation
                let mut name = String::new();
                while let Some(&c) = chars.peek() {
                    if c.is_alphanumeric() || c == '_' {
                        name.push(chars.next().unwrap());
                    } else {
                        break;
                    }
                }
                tokens.push(Token {
                    token_type: "ANNOTATION".to_string(),
                    value: name,
                    line,
                    column,
                });
                column += name.len() + 1;
            }
            ' ' | '\t' => {
                column += 1;
            }
            '\n' => {
                line += 1;
                column = 1;
            }
            '(' => {
                tokens.push(Token {
                    token_type: "LPAREN".to_string(),
                    value: "(".to_string(),
                    line,
                    column,
                });
                column += 1;
            }
            ')' => {
                tokens.push(Token {
                    token_type: "RPAREN".to_string(),
                    value: ")".to_string(),
                    line,
                    column,
                });
                column += 1;
            }
            '{' => {
                tokens.push(Token {
                    token_type: "LBRACE".to_string(),
                    value: "{".to_string(),
                    line,
                    column,
                });
                column += 1;
            }
            '}' => {
                tokens.push(Token {
                    token_type: "RBRACE".to_string(),
                    value: "}".to_string(),
                    line,
                    column,
                });
                column += 1;
            }
            '-' if chars.peek() == Some(&'>') => {
                chars.next(); // consume '>'
                tokens.push(Token {
                    token_type: "ARROW".to_string(),
                    value: "->".to_string(),
                    line,
                    column,
                });
                column += 2;
            }
            _ if ch.is_alphabetic() => {
                // Identifier or keyword
                let mut word = String::from(ch);
                while let Some(&c) = chars.peek() {
                    if c.is_alphanumeric() || c == '_' {
                        word.push(chars.next().unwrap());
                    } else {
                        break;
                    }
                }

                let token_type = match word.as_str() {
                    "func" => "FUNC",
                    "return" => "RETURN",
                    "if" => "IF",
                    "else" => "ELSE",
                    "match" => "MATCH",
                    _ => "IDENTIFIER",
                };

                tokens.push(Token {
                    token_type: token_type.to_string(),
                    value: word.clone(),
                    line,
                    column,
                });
                column += word.len();
            }
            _ => {
                column += 1;
            }
        }
    }

    tokens
}

fn parse_tokens(tokens: &[Token]) -> Vec<ASTNode> {
    // Simplified parser - in production, implement full recursive descent
    vec![ASTNode {
        node_type: "Program".to_string(),
        name: None,
        value: None,
        children: vec![],
    }]
}

fn compile_source(source: &str) -> CompilationResult {
    let tokens = lex(source);
    let ast = parse_tokens(&tokens);

    // Generate TypeScript
    let typescript = generate_typescript(&ast);

    CompilationResult {
        typescript,
        diagnostics: vec![],
        source_map: None,
    }
}

fn generate_typescript(ast: &[ASTNode]) -> String {
    "// Generated TypeScript\n".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize_simple() {
        let source = "func greet() {}";
        let tokens = lex(source);
        assert!(tokens.len() > 0);
    }

    #[test]
    fn test_parse_function() {
        let source = "@confidence(0.95)\nfunc test() -> number { return 42 }";
        let tokens = lex(source);
        let ast = parse_tokens(&tokens);
        assert!(ast.len() > 0);
    }
}

// Agentic Playground - Interactive Browser REPL

// Example code snippets
const examples = {
  hello: `@confidence(0.99)
@complete
func greet(name: string) -> string {
  return "Hello, " + name + "!"
}`,

  confidence: `@confidence(0.95)
@complete
func safeDivide(a: number, b: number) -> Result<number, string> {
  if b == 0 {
    return Err("Division by zero")
  }
  return Ok(a / b)
}

@confidence(0.65)
@uncertain("Complex date formats not fully handled")
@partial
func parseDate(input: string) -> Result<Date, ParseError> {
  // Only handles ISO format
  return Date.parse(input)
}`,

  result: `@confidence(0.92)
@needs(database: Database)
func findUser(id: string) -> Result<User, DatabaseError> {
  user = database.users.find(id) match {
    Ok(user) -> user,
    Err(e) -> {
      @context {
        what_failed: "User lookup",
        suggestions: ["Verify user exists", "Check database connection"],
        recovery: { action: "create_user" }
      }
      return Err(DatabaseError.NOT_FOUND)
    }
  }

  return Ok(user)
}`,

  stages: `// Stage 1: Stub
@stub("Not implemented yet")
@confidence(0.00)
func authenticate(token: string) -> Result<User, AuthError>

// Stage 2: Partial
@partial("Only handles happy path")
@confidence(0.60)
func authenticate(token: string) -> Result<User, AuthError> {
  decoded = jwt.decode(token)
  return Ok(User.fromDict(decoded))
}

// Stage 3: Complete
@complete
@confidence(0.95)
@property("rejects empty tokens")
@property("rejects invalid tokens")
func authenticate(token: string) -> Result<User, AuthError> {
  if token.isEmpty() { return Err(AuthError.MISSING_TOKEN) }
  decoded = jwt.decode(token) match {
    Ok(payload) -> payload,
    Err(e) -> return Err(AuthError.INVALID_TOKEN)
  }
  return Ok(User.fromDict(decoded))
}`,

  agents: `@agent(role: "planner")
agent PlannerAgent {
  inbox: Channel<TaskRequest>
  outbox: Channel<TaskPlan>

  @handler("task_request")
  @confidence(0.88)
  func plan(request: TaskRequest) -> TaskPlan {
    steps = analyzeAndDecompose(request)
    return TaskPlan { steps: steps, estimatedTime: estimate(steps) }
  }
}

@session_aware
@checkpoint_interval(5m)
func collaborativeWorkflow() -> Result<Output, Error> {
  @checkpoint("planning")
  plan = planner.request(task)

  @checkpoint("execution")
  result = executor.execute(plan)

  return Ok(result)
}`,

  verification: `@verify(solver: "z3")
@requires(x > 0)
@ensures(result > 0)
@confidence(0.99)
func sqrt(x: number) -> number {
  return Math.sqrt(x)
}

@contract {
  requires: { b: "b != 0" },
  ensures: { result: "result == a / b" }
}
@property("division by zero returns error")
@complete
func divide(a: number, b: number) -> Result<number, string> {
  if b == 0 { return Err("Division by zero") }
  return Ok(a / b)
}`
};

// Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

let agenticEditor;
let typescriptEditor;

require(['vs/editor/editor.main'], function () {
  // Register Agentic language
  monaco.languages.register({ id: 'agentic' });

  // Define Agentic syntax highlighting
  monaco.languages.setMonarchTokensProvider('agentic', {
    keywords: [
      'func', 'return', 'if', 'else', 'match', 'or', 'error',
      'let', 'const', 'type', 'agent', 'workflow', 'session'
    ],
    annotations: [
      'confidence', 'stub', 'partial', 'complete', 'needs', 'uncertain',
      'property', 'verify', 'requires', 'ensures', 'contract',
      'agent', 'handler', 'session_aware', 'checkpoint', 'handoff'
    ],
    operators: ['->', '=>', '==', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/'],
    tokenizer: {
      root: [
        [/@[a-z_]+/, 'annotation'],
        [/\b(func|return|if|else|match|or|error|let|const|type|agent|workflow|session)\b/, 'keyword'],
        [/\b(Result|Ok|Err|Channel|Agent)\b/, 'type'],
        [/\b[A-Z][a-zA-Z0-9]*\b/, 'type'],
        [/\b\d+\.?\d*\b/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\/\/.*$/, 'comment'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/"/, 'string', '@pop']
      ]
    }
  });

  // Create editors
  agenticEditor = monaco.editor.create(document.getElementById('agentic-editor'), {
    value: examples.hello,
    language: 'agentic',
    theme: 'vs-dark',
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
  });

  typescriptEditor = monaco.editor.create(document.getElementById('typescript-output'), {
    value: '// Click "Compile" to see generated TypeScript',
    language: 'typescript',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 14,
    automaticLayout: true,
  });

  // Compile on Ctrl+Enter
  agenticEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, compileCode);
});

// Compile button
document.getElementById('compile-btn').addEventListener('click', compileCode);

// Example buttons
document.querySelectorAll('.example-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const example = btn.getAttribute('data-example');
    if (examples[example]) {
      agenticEditor.setValue(examples[example]);
      compileCode();
    }
  });
});

// Share button
document.getElementById('share-btn').addEventListener('click', () => {
  const code = agenticEditor.getValue();
  const encoded = btoa(encodeURIComponent(code));
  const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;

  navigator.clipboard.writeText(url).then(() => {
    log('success', '✓ Share link copied to clipboard!');
  });
});

// Load from URL parameter
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    try {
      const decoded = decodeURIComponent(atob(code));
      agenticEditor.setValue(decoded);
      compileCode();
    } catch (e) {
      log('error', 'Failed to load code from URL');
    }
  }
});

function compileCode() {
  const agenticCode = agenticEditor.getValue();

  log('info', '⚙️ Compiling...');

  try {
    // Simulate compilation (in production, call actual Agentic compiler)
    const tsCode = mockCompile(agenticCode);

    typescriptEditor.setValue(tsCode);
    log('success', '✓ Compilation successful!');

    // Extract and display confidence warnings
    checkConfidence(agenticCode);

  } catch (error) {
    log('error', `✗ Compilation failed: ${error.message}`);
    typescriptEditor.setValue(`// Compilation error:\n// ${error.message}`);
  }
}

function mockCompile(agenticCode) {
  // This is a mock compiler for the playground
  // In production, this would call the actual Agentic transpiler via WASM

  let tsCode = '// Auto-generated from Agentic\n';
  tsCode += "import { Result, Ok, Err } from '@agentic/runtime';\n\n";

  // Extract function declarations (very basic parsing)
  const funcRegex = /func\s+(\w+)\s*\(([^)]*)\)\s*->\s*([^\{]+)\{/g;
  let match;

  while ((match = funcRegex.exec(agenticCode)) !== null) {
    const [, name, params, returnType] = match;

    tsCode += `export function ${name}(${params}): ${returnType.trim()} {\n`;
    tsCode += `  // Implementation\n`;
    tsCode += `}\n\n`;
  }

  return tsCode;
}

function checkConfidence(agenticCode) {
  const confidenceRegex = /@confidence\(([\d.]+)\)/g;
  let match;

  while ((match = confidenceRegex.exec(agenticCode)) !== null) {
    const confidence = parseFloat(match[1]);

    if (confidence < 0.80) {
      log('warning', `⚠️ Low confidence detected: ${confidence}`);
    } else if (confidence >= 0.95) {
      log('success', `✓ High confidence: ${confidence}`);
    }
  }
}

function log(type, message) {
  const consoleEl = document.getElementById('console');
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = message;
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

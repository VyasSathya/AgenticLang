/**
 * Agentic Language Server Protocol Implementation
 * Based on rust-analyzer and TypeScript Language Server architecture
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  CompletionItem,
  CompletionItemKind,
  Diagnostic as LSPDiagnostic,
  DiagnosticSeverity as LSPSeverity,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity } from '../diagnostics/diagnostic';

// Create LSP connection
const connection = createConnection(ProposedFeatures.all);

// Document manager
const documents = new TextDocuments(TextDocument);

// Server state
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['@', '.', ':'],
      },
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
      semanticTokensProvider: {
        legend: {
          tokenTypes: [
            'function',
            'parameter',
            'variable',
            'type',
            'annotation',
            'confidenceLow',
            'confidenceHigh',
            'stageStub',
            'stagePartial',
            'stageComplete',
          ],
          tokenModifiers: ['declaration', 'readonly', 'deprecated', 'uncertain'],
        },
        full: true,
      },
    },
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for configuration changes
    // connection.client.register('workspace/didChangeConfiguration');
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(() => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// Document change handler
documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

// Validation function
async function validateDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: LSPDiagnostic[] = [];

  try {
    // Parse the document
    // const { ast, diagnostics: agenticDiags } = parse(text);

    // Convert Agentic diagnostics to LSP diagnostics
    // diagnostics.push(...convertDiagnostics(agenticDiags));
  } catch (error) {
    // Handle parse errors
    connection.console.error(`Parse error: ${error}`);
  }

  // Send diagnostics to client
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Completion provider
connection.onCompletion(
  (textDocumentPosition): CompletionItem[] => {
    // Return Agentic-specific completions
    return [
      {
        label: '@confidence',
        kind: CompletionItemKind.Keyword,
        insertText: '@confidence(${1:0.90})',
        detail: 'Declare confidence level (0.0 - 1.0)',
        documentation: 'Add a confidence annotation to track uncertainty',
      },
      {
        label: '@needs',
        kind: CompletionItemKind.Keyword,
        insertText: '@needs(${1:dependency})',
        detail: 'Declare required context',
        documentation: 'Specify dependencies required by this function',
      },
      {
        label: '@stub',
        kind: CompletionItemKind.Keyword,
        detail: 'Mark function as stub (not implemented)',
      },
      {
        label: '@partial',
        kind: CompletionItemKind.Keyword,
        detail: 'Mark function as partially implemented',
      },
      {
        label: '@complete',
        kind: CompletionItemKind.Keyword,
        detail: 'Mark function as fully implemented',
      },
      {
        label: 'Result',
        kind: CompletionItemKind.TypeParameter,
        insertText: 'Result<${1:T}, ${2:E}>',
        detail: 'Result type for error handling',
      },
    ];
  }
);

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

console.log('Agentic Language Server started');

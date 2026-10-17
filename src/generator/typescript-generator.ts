/**
 * TypeScript code generator
 * Converts Agentic AST to TypeScript code
 */

import * as AST from '../types';
import { SourceMapGenerator } from 'source-map';

export class TypeScriptGenerator {
  private sourceMap: SourceMapGenerator;
  private generatedLine = 1;
  private generatedColumn = 0;
  private indent = 0;

  constructor(private sourceFileName: string) {
    this.sourceMap = new SourceMapGenerator({
      file: sourceFileName.replace('.agentic', '.ts'),
    });
  }

  generate(ast: AST.ASTNode[]): string {
    let code = '';

    // Add runtime imports
    code += this.generateRuntimeImports();

    // Generate each statement
    for (const node of ast) {
      code += this.generateNode(node);
      code += '\n\n';
      this.generatedLine += 2;
    }

    return code;
  }

  private generateRuntimeImports(): string {
    return `// Auto-generated from ${this.sourceFileName}
import { AgenticRuntime, Result, Ok, Err } from './runtime';

`;
  }

  private generateNode(node: AST.ASTNode): string {
    switch (node.type) {
      case 'FunctionDeclaration':
        return this.generateFunctionDeclaration(node);
      case 'VariableDeclaration':
        return this.generateVariableDeclaration(node);
      case 'ReturnStatement':
        return this.generateReturnStatement(node);
      case 'IfStatement':
        return this.generateIfStatement(node);
      case 'BlockStatement':
        return this.generateBlockStatement(node);
      case 'BinaryExpression':
        return this.generateBinaryExpression(node);
      case 'CallExpression':
        return this.generateCallExpression(node);
      case 'MatchExpression':
        return this.generateMatchExpression(node);
      case 'ErrorRecovery':
        return this.generateErrorRecovery(node);
      case 'Identifier':
        return (node as AST.Identifier).name;
      case 'Literal':
        return this.generateLiteral(node);
      default:
        // Should never reach here if all cases are handled
        const exhaustiveCheck: never = node;
        return `/* Unsupported node: ${(exhaustiveCheck as any).type} */`;
    }
  }

  private generateFunctionDeclaration(node: AST.FunctionDeclaration): string {
    let code = '';

    // Extract annotation metadata
    const confidenceAnnotation = node.annotations.find(a => a.name === 'confidence');
    const stageAnnotation = node.annotations.find(a =>
      a.name === 'stub' || a.name === 'partial' || a.name === 'complete'
    );
    const needsAnnotation = node.annotations.find(a => a.name === 'needs');
    const uncertainAnnotation = node.annotations.find(a => a.name === 'uncertain');

    // Generate annotations as comments
    for (const annotation of node.annotations) {
      const argsStr = Object.keys(annotation.args).length > 0
        ? `(${JSON.stringify(annotation.args)})`
        : '';
      code += `// @${annotation.name}${argsStr}\n`;
    }

    // Function signature
    code += `function ${node.name}(`;

    // Parameters
    const params = node.params.map(p => {
      const type = p.typeAnnotation ? this.generateTypeAnnotation(p.typeAnnotation) : 'any';
      return `${p.name}: ${type}`;
    });
    code += params.join(', ');

    code += ')';

    // Return type
    if (node.returnType) {
      code += `: ${this.generateTypeAnnotation(node.returnType)}`;
    }

    code += ' {\n';
    this.indent++;

    // Add runtime tracking for annotations
    if (confidenceAnnotation && confidenceAnnotation.args.arg0 !== undefined) {
      const confidenceLevel = confidenceAnnotation.args.arg0;
      const reason = confidenceAnnotation.args.arg1 || confidenceAnnotation.args.reason || 'No reason provided';
      code += `${this.indentation()}AgenticRuntime.confidence.register('${node.name}', ${confidenceLevel}, '${reason}');\n`;
    }

    if (stageAnnotation) {
      code += `${this.indentation()}// Stage: ${stageAnnotation.name}\n`;
      if (stageAnnotation.name === 'stub') {
        code += `${this.indentation()}throw new Error('Function ${node.name} is a stub - not yet implemented');\n`;
      }
    }

    if (needsAnnotation) {
      const requirements = Object.values(needsAnnotation.args);
      code += `${this.indentation()}// Required context: ${requirements.join(', ')}\n`;
    }

    if (uncertainAnnotation) {
      const areas = Object.values(uncertainAnnotation.args);
      code += `${this.indentation()}console.warn('⚠️  Uncertain areas in ${node.name}:', ${JSON.stringify(areas)});\n`;
    }

    // Generate the function body (but skip if it's a stub)
    if (!stageAnnotation || stageAnnotation.name !== 'stub') {
      for (const stmt of node.body.body) {
        code += this.generateNode(stmt);
        if (stmt.type !== 'IfStatement' && stmt.type !== 'BlockStatement') {
          if (!code.trim().endsWith(';')) {
            code += ';';
          }
        }
        code += '\n';
      }
    }

    this.indent--;
    code += this.indentation() + '}';

    return code;
  }

  private generateTypeAnnotation(type: AST.TypeAnnotation): string {
    if (type.kind === 'primitive' || type.kind === 'custom') {
      return type.value as string;
    }

    if (type.kind === 'union' && Array.isArray(type.value)) {
      return type.value.map(t => this.generateTypeAnnotation(t)).join(' | ');
    }

    if (type.kind === 'result' && Array.isArray(type.value)) {
      const [okType, errType] = type.value;
      return `Result<${this.generateTypeAnnotation(okType)}, ${this.generateTypeAnnotation(errType)}>`;
    }

    return 'any';
  }

  private generateVariableDeclaration(node: AST.VariableDeclaration): string {
    const keyword = 'const'; // Default to const for safety
    let code = `${this.indentation()}${keyword} ${node.name}`;

    if (node.typeAnnotation) {
      code += `: ${this.generateTypeAnnotation(node.typeAnnotation)}`;
    }

    if (node.initializer) {
      code += ` = ${this.generateNode(node.initializer)}`;
    }

    code += ';';
    return code;
  }

  private generateReturnStatement(node: AST.ReturnStatement): string {
    let code = `${this.indentation()}return`;

    if (node.argument) {
      code += ` ${this.generateNode(node.argument)}`;
    }

    code += ';';
    return code;
  }

  private generateIfStatement(node: AST.IfStatement): string {
    let code = `${this.indentation()}if (${this.generateNode(node.condition)}) `;

    code += this.generateBlockStatement(node.consequent);

    if (node.alternate) {
      code += ' else ';
      if (node.alternate.type === 'IfStatement') {
        code += this.generateIfStatement(node.alternate).trim();
      } else {
        code += this.generateBlockStatement(node.alternate);
      }
    }

    return code;
  }

  private generateBlockStatement(node: AST.BlockStatement): string {
    let code = '{\n';
    this.indent++;

    for (const stmt of node.body) {
      code += this.generateNode(stmt);
      if (stmt.type !== 'IfStatement' && stmt.type !== 'BlockStatement') {
        if (!code.trim().endsWith(';')) {
          code += ';';
        }
      }
      code += '\n';
    }

    this.indent--;
    code += this.indentation() + '}';

    return code;
  }

  private generateBinaryExpression(node: AST.BinaryExpression): string {
    const left = this.generateNode(node.left);
    const right = this.generateNode(node.right);

    // Convert Agentic operators to TypeScript
    const operator = node.operator;

    return `${left} ${operator} ${right}`;
  }

  private generateCallExpression(node: AST.CallExpression): string {
    const callee = this.generateNode(node.callee);
    const args = node.arguments.map(arg => this.generateNode(arg)).join(', ');

    return `${callee}(${args})`;
  }

  private generateLiteral(node: AST.Literal): string {
    if (typeof node.value === 'string') {
      return `"${node.value}"`;
    }
    if (node.value === null) {
      return 'null';
    }
    return String(node.value);
  }

  private indentation(): string {
    return '  '.repeat(this.indent);
  }

  private generateMatchExpression(node: AST.MatchExpression): string {
    // Generate: discriminant.ok ? case1 : case2
    // Or more sophisticated pattern matching
    const discriminant = this.generateNode(node.discriminant);

    let code = `(() => {\n`;
    this.indent++;

    code += `${this.indentation()}const __match_value = ${discriminant};\n`;

    for (let i = 0; i < node.cases.length; i++) {
      const matchCase = node.cases[i];
      const isLast = i === node.cases.length - 1;

      if (matchCase.pattern === 'Ok' || matchCase.pattern === 'Err') {
        const condition = matchCase.pattern === 'Ok' ? '__match_value.ok' : '!__match_value.ok';

        if (i === 0) {
          code += `${this.indentation()}if (${condition}) {\n`;
        } else {
          code += `${this.indentation()} else if (${condition}) {\n`;
        }

        this.indent++;

        // Bind the value if there's a binding
        if (matchCase.binding) {
          const valueAccess = matchCase.pattern === 'Ok' ? '__match_value.value' : '__match_value.error';
          code += `${this.indentation()}const ${matchCase.binding} = ${valueAccess};\n`;
        }

        // Generate the body
        if (matchCase.body.type === 'BlockStatement') {
          const bodyCode = this.generateBlockStatement(matchCase.body);
          // Extract just the statements from the block
          const bodyLines = bodyCode.split('\n').slice(1, -1);
          code += bodyLines.join('\n') + '\n';
        } else {
          code += `${this.indentation()}return ${this.generateNode(matchCase.body)};\n`;
        }

        this.indent--;
        code += `${this.indentation()}}\n`;

      } else if (matchCase.pattern === '_') {
        // Default case
        code += `${this.indentation()} else {\n`;
        this.indent++;

        if (matchCase.body.type === 'BlockStatement') {
          const bodyCode = this.generateBlockStatement(matchCase.body);
          const bodyLines = bodyCode.split('\n').slice(1, -1);
          code += bodyLines.join('\n') + '\n';
        } else {
          code += `${this.indentation()}return ${this.generateNode(matchCase.body)};\n`;
        }

        this.indent--;
        code += `${this.indentation()}}\n`;
      }
    }

    this.indent--;
    code += `${this.indentation()}})()`;

    return code;
  }

  private generateErrorRecovery(node: AST.ErrorRecovery): string {
    // Generate try-catch with context logging
    let code = `(() => {\n`;
    this.indent++;

    code += `${this.indentation()}try {\n`;
    this.indent++;
    code += `${this.indentation()}// Original operation would go here\n`;
    code += `${this.indentation()}throw new Error('Operation failed');\n`;
    this.indent--;
    code += `${this.indentation()}} catch (${node.binding}) {\n`;
    this.indent++;

    // Log context if available
    if (Object.keys(node.contextBlock).length > 0) {
      code += `${this.indentation()}console.error('Error context:', ${JSON.stringify(node.contextBlock, null, 2)});\n`;
    }

    // Generate error action
    code += `${this.indentation()}${this.generateNode(node.errorAction)}\n`;

    this.indent--;
    code += `${this.indentation()}}\n`;

    this.indent--;
    code += `${this.indentation()}})()`;

    return code;
  }

  getSourceMap(): string {
    return JSON.stringify(this.sourceMap.toJSON());
  }

  getCodeWithInlineSourceMap(code: string): string {
    const map = Buffer.from(this.getSourceMap()).toString('base64');
    return `${code}\n//# sourceMappingURL=data:application/json;base64,${map}`;
  }
}
// Stingray TypeScript Definitions
declare module 'stingray' {
  import React from 'react';

  // Stingray AST Types
  interface StingrayProgram {
    type: 'StingrayProgram';
    filename: string;
    children: StingrayNode[];
    imports: ImportDeclaration[];
    exports: ExportDeclaration[];
    metadata: ProgramMetadata;
  }

  interface ProgramMetadata {
    language: string;
    version: string;
    features: string[];
  }

  type StingrayNode = 
    | ComponentDeclaration
    | PageDeclaration
    | LayoutDeclaration
    | StyleBlock
    | ScriptBlock
    | TemplateBlock
    | StateDeclaration
    | EffectDeclaration
    | HookDeclaration
    | EventDeclaration
    | MixinDeclaration
    | ThemeDeclaration
    | FragmentBlock;

  interface ComponentDeclaration {
    type: 'ComponentDeclaration';
    name: string;
    extends?: string;
    javascript: string;
    template: string;
    styles: string;
    line: number;
  }

  interface PageDeclaration {
    type: 'PageDeclaration';
    name: string;
    content: string;
    line: number;
  }

  interface LayoutDeclaration {
    type: 'LayoutDeclaration';
    name: string;
    content: string;
    line: number;
  }

  interface StyleBlock {
    type: 'StyleBlock';
    content: string;
    global: boolean;
    line: number;
  }

  interface ScriptBlock {
    type: 'ScriptBlock';
    content: string;
    ast: any;
    module: boolean;
    line: number;
  }

  // Parser
  class StingrayParser {
    parse(source: string, filename?: string): StingrayProgram;
    parseFile(filename: string): StingrayProgram;
    getErrors(): ParseError[];
    getWarnings(): ParseWarning[];
  }

  interface ParseError {
    file: string;
    line: number;
    column: number;
    message: string;
  }

  interface ParseWarning {
    file: string;
    line: number;
    message: string;
  }

  // Transpiler
  class StingrayTranspiler {
    transpile(ast: StingrayProgram, filename?: string): TranspiledResult;
    processTemplate(content: string, context: string): string;
    processStyles(content: string, context: string): string;
  }

  interface TranspiledResult {
    html: string;
    css: string;
    js: string;
    react: string;
    metadata: {
      filename: string;
      features: string[];
      imports: ImportDeclaration[];
      exports: ExportDeclaration[];
    };
  }

  // Compiler
  class StingrayCompiler {
    compile(input: string | string[], outputDir?: string): Promise<CompileResult>;
    compileProject(projectDir: string, outputDir?: string): Promise<CompileResult>;
    getStats(): CompilerStats;
  }

  interface CompileResult {
    success: boolean;
    results: CompiledFile[];
    stats: CompilerStats;
  }

  interface CompiledFile {
    inputFile: string;
    baseName: string;
    outputDir: string;
    files: Record<string, string>;
  }

  interface CompilerStats {
    filesProcessed: number;
    errors: Error[];
    warnings: Warning[];
    buildTime: number;
  }

  // Runtime
  class StingrayRuntime {
    init(): Promise<this>;
    startServer(): Promise<any>;
    shutdown(): Promise<void>;
    use(middleware: Function): this;
    registerComponent(name: string, component: any): this;
    getComponent(name: string): any;
  }

  // Global State
  interface StingrayState {
    get(key: string): any;
    set(key: string, value: any): void;
    delete(key: string): boolean;
    clear(): void;
    keys(): string[];
    has(key: string): boolean;
  }

  // Global Events
  interface StingrayEvents {
    on(name: string, handler: Function): void;
    emit(name: string, data?: any): void;
    off(name: string, handler: Function): void;
  }

  // Global FS
  interface StingrayFS {
    read(file: string): Promise<string>;
    write(file: string, content: string): Promise<boolean>;
    exists(file: string): Promise<boolean>;
    mkdir(dir: string, recursive?: boolean): Promise<boolean>;
    remove(file: string): Promise<boolean>;
    readdir(dir: string): Promise<string[]>;
    stat(file: string): any;
  }

  // Global Fetch
  interface StingrayResponse {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Headers;
    json(): Promise<any>;
    text(): Promise<string>;
    blob(): Promise<Blob>;
  }

  // Components
  interface StingrayComponent {
    tag: string;
    props: string[];
    events: string[];
  }

  // Themes
  interface StingrayTheme {
    primary: string;
    secondary: string;
    surface: string;
    background: string;
    error: string;
    onPrimary: string;
    onSecondary: string;
    onSurface: string;
    onBackground: string;
    onError: string;
    textPrimary: string;
    textSecondary: string;
  }

  // CLI
  class StingrayCLI {
    run(args?: string[]): Promise<void>;
  }

  // System Integration
  class StingraySystem {
    getSystemInfo(): SystemInfo;
    exec(command: string, options?: ExecOptions): Promise<ExecResult>;
    execSync(command: string, options?: ExecOptions): ExecResult;
    readFile(file: string, encoding?: string): Promise<FileResult<string>>;
    writeFile(file: string, content: string, encoding?: string): Promise<FileResult<boolean>>;
    checkPort(port: number, host?: string): Promise<PortResult>;
    findAvailablePort(startPort?: number, maxPorts?: number): Promise<number>;
    getMimeType(filename: string): string;
  }

  interface SystemInfo {
    platform: string;
    arch: string;
    hostname: string;
    cpus: number;
    memory: { total: number; free: number; available: number };
    uptime: number;
    release: string;
  }

  interface ExecOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
    maxBuffer?: number;
  }

  interface ExecResult {
    stdout?: string;
    stderr?: string;
    error?: string;
  }

  interface FileResult<T> {
    success: boolean;
    content?: T;
    error?: string;
  }

  interface PortResult {
    port: number;
    available: boolean;
  }

  // Main Export
  const Stingray: {
    version: string;
    name: string;
    extension: string;
    parse(source: string, filename?: string): StingrayProgram;
    transpile(ast: StingrayProgram, filename?: string): TranspiledResult;
    compile(input: string | string[], output?: string): Promise<CompileResult>;
    createRuntime(options?: RuntimeOptions): StingrayRuntime;
    createCLI(): StingrayCLI;
    createSystem(): StingraySystem;
    quickStart(): void;
  };

  interface RuntimeOptions {
    port?: number;
    host?: string;
    hotReload?: boolean;
    debug?: boolean;
    env?: string;
  }

  // Global declarations
  declare const state: StingrayState;
  declare const events: StingrayEvents;
  declare const fs: StingrayFS;
  declare const fetch: (url: string, options?: RequestInit) => Promise<StingrayResponse>;
  declare const stingray: {
    version: string;
    env: string;
    platform: string;
    isBrowser: boolean;
    isNode: boolean;
    isDev: boolean;
    isProd: boolean;
    config: RuntimeOptions;
  };

  export default Stingray;
  export {
    StingrayParser,
    StingrayTranspiler,
    StingrayCompiler,
    StingrayRuntime,
    StingrayCLI,
    StingraySystem,
    StingrayProgram,
    StingrayNode,
    TranspiledResult,
    CompileResult,
    StingrayTheme,
    StingrayComponent
  };
}

import { loadPyodide, type PyodideInterface } from 'pyodide';
import { getQuickJS, type QuickJSWASMModule, type QuickJSHandle } from 'quickjs-emscripten';
import * as esbuild from 'esbuild-wasm';
import type { CodeExecutionResult } from './types';

let quickJsModulePromise: Promise<QuickJSWASMModule> | null = null;
let pyodidePromise: Promise<PyodideInterface> | null = null;
let esbuildInitialized = false;

async function ensureQuickJS() {
  if (!quickJsModulePromise) {
    quickJsModulePromise = getQuickJS();
  }
  return quickJsModulePromise;
}

async function ensurePyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/' });
  }
  return pyodidePromise;
}

async function ensureEsbuild() {
  if (esbuildInitialized) return;
  await esbuild.initialize({ wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.2/esbuild.wasm' });
  esbuildInitialized = true;
}

async function runJavaScript(code: string) {
  const quickjs = await ensureQuickJS();
  const ctx = quickjs.newContext();

  let output = '';

  const createLogFn = () =>
    ctx.newFunction('log', (...args) => {
      const text = args.map((arg) => ctx.dump(arg)).join(' ');
      output += `${text}\n`;
    });

  const consoleObj = ctx.newObject();
  const logFn = createLogFn();
  const errorFn = createLogFn();

  ctx.setProp(consoleObj, 'log', logFn);
  ctx.setProp(consoleObj, 'error', errorFn);
  ctx.setProp(ctx.global, 'console', consoleObj);

  try {
    const result = ctx.evalCode(code);
    if (result.error) {
      const errorText = ctx.dump(result.error);
      result.error.dispose();
      throw new Error(typeof errorText === 'string' ? errorText : JSON.stringify(errorText));
    }

    const value = (result as { value?: QuickJSHandle }).value;
    value?.dispose();

    return { success: true, output: output.trimEnd() };
  } catch (error) {
    return {
      success: false,
      output: output.trimEnd(),
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    logFn.dispose();
    errorFn.dispose();
    consoleObj.dispose();
    ctx.dispose();
  }
}

async function runTypeScript(code: string) {
  await ensureEsbuild();
  const transpiled = await esbuild.transform(code, { loader: 'ts', target: 'es2020' });
  return runJavaScript(transpiled.code);
}

async function runPython(code: string) {
  const pyodide = await ensurePyodide();
  let stdout = '';
  let stderr = '';

  const stdoutHook = { batched: (s: string) => (stdout += s) };
  const stderrHook = { batched: (s: string) => (stderr += s) };

  pyodide.setStdout(stdoutHook);
  pyodide.setStderr(stderrHook);

  try {
    await pyodide.runPythonAsync(code);
    return {
      success: stderr.length === 0,
      output: stdout.trimEnd(),
      error: stderr ? stderr.trimEnd() : undefined,
    };
  } catch (error) {
    return {
      success: false,
      output: stdout.trimEnd(),
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    pyodide.setStdout();
    pyodide.setStderr();
  }
}

export async function executeInBrowser(code: string, language: string): Promise<CodeExecutionResult> {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    let result: { success: boolean; output: string; error?: string };

    switch (language) {
      case 'javascript':
        result = await runJavaScript(code);
        break;
      case 'typescript':
        result = await runTypeScript(code);
        break;
      case 'python':
        result = await runPython(code);
        break;
      default:
        return {
          success: false,
          output: '',
          error: `Unsupported language for browser execution: ${language}`,
          executionTime: 0,
        };
    }

    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: end - start,
    };
  } catch (error) {
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
      executionTime: end - start,
    };
  }
}

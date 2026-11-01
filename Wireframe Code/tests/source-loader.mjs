import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
export function loadSource(path, imports = {}, globals = {}) {
  const filename = new URL(`../src/${path}`, import.meta.url)
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      FormData,
      Headers,
      URLSearchParams,
      URL,
      Request,
      Response,
      TextDecoder,
      TextEncoder,
      AbortController,
      setTimeout,
      clearTimeout,
      process: { env: {} },
      ...globals,
      console,
      require: (name) => {
        if (name in imports) return imports[name]
        if (name.startsWith('node:')) return require(name)
        if (name.startsWith('.'))
          return loadSource(
            new URL(`${name}.ts`, filename).pathname.split('/src/')[1],
            imports,
            globals,
          )
        throw new Error(`Unmocked dependency ${name} in ${path}`)
      },
    },
    { filename: path },
  )
  return module.exports
}

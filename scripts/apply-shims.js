const fs = require('fs')
const path = require('path')

const root = process.cwd()
const targetBase = path.join(root, 'node_modules', 'es-toolkit')

function exists(p) {
  try {
    return fs.existsSync(p)
  } catch {
    return false
  }
}

const files = {
  // dist/index.js (CJS)
  [path.join(targetBase, 'dist', 'index.js')]: `// Minimal dist entry for es-toolkit to satisfy imports used by bundled libraries (e.g. recharts).
function noop() {}
function isNotNil(v) { return v !== null && v !== undefined }
module.exports = { noop, isNotNil }
`,

  // dist/index.mjs (ESM)
  [path.join(targetBase, 'dist', 'index.mjs')]: `export function noop() {}
export function isNotNil(v) { return v !== null && v !== undefined }
`,

  // dist/compat/array/last.js
  [path.join(targetBase, 'dist', 'compat', 'array', 'last.js')]: `function last(arr) {
  if (arr == null) return undefined
  if (Array.isArray(arr)) return arr.length ? arr[arr.length - 1] : undefined
  try {
    let lastVal
    for (const v of arr) lastVal = v
    return lastVal
  } catch (e) {
    return undefined
  }
}
module.exports = { last }
`,

  // dist/compat/array/sortBy.js
  [path.join(targetBase, 'dist', 'compat', 'array', 'sortBy.js')]: `module.exports = { sortBy: require('../../../compat/sortBy.js').sortBy }
`,

  // dist/compat/array/uniqBy.js
  [path.join(targetBase, 'dist', 'compat', 'array', 'uniqBy.js')]: `module.exports = { uniqBy: require('../../../compat/uniqBy.js').uniqBy }
`,

  // dist/compat/function/throttle.js
  [path.join(targetBase, 'dist', 'compat', 'function', 'throttle.js')]: `module.exports = { throttle: require('../../../compat/throttle.js').throttle }
`,

  // dist/compat/object/get.js
  [path.join(targetBase, 'dist', 'compat', 'object', 'get.js')]: `module.exports = { get: require('../../../compat/get.js').get }
`,

  // dist/compat/predicate/isPlainObject.js
  [path.join(targetBase, 'dist', 'compat', 'predicate', 'isPlainObject.js')]: `module.exports = { isPlainObject: require('../../../compat/isPlainObject.js').isPlainObject }
`,

  // compat/range.js
  [path.join(targetBase, 'compat', 'range.js')]: `// Minimal implementation of range(start, end, step)
module.exports = function range(start, end, step) {
  if (end === undefined) {
    end = start === undefined ? 0 : start
    start = 0
  }
  step = step === undefined ? (start < end ? 1 : -1) : step
  const result = []
  if (step === 0) return result
  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(i)
  } else {
    for (let i = start; i > end; i += step) result.push(i)
  }
  return result
}
`,

  // dist/compat/math/range.js (wrapper)
  [path.join(targetBase, 'dist', 'compat', 'math', 'range.js')]: `module.exports = { range: require('../../../compat/range.js').range }
`,
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!exists(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Only apply shims if the target package exists
if (!exists(targetBase)) {
  console.log('apply-shims: es-toolkit not found in node_modules — skipping shims.')
  process.exit(0)
}

let wrote = 0
for (const [p, content] of Object.entries(files)) {
  try {
    ensureDir(p)

    // If a file already exists with the same content, skip writing
    if (exists(p)) {
      const existing = fs.readFileSync(p, 'utf8')
      if (existing === content) continue

      // Back up original before overwriting
      const backup = p + '.bak'
      if (!exists(backup)) fs.copyFileSync(p, backup)
    }

    fs.writeFileSync(p, content, 'utf8')
    wrote++
  } catch (e) {
    // ignore individual file errors
  }
}

console.log(`apply-shims: wrote ${wrote} files to node_modules/es-toolkit (if present).`)
 
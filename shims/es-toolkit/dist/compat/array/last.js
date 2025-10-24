// Minimal shim for es-toolkit's dist/compat/array/last.js
// Some versions of the `es-toolkit` package reference this built file directly
// (e.g. `require('../dist/compat/array/last.js').last`) which can be missing
// in certain distributions. This file provides a tiny compatible implementation.

function last(arr) {
  if (arr == null) return undefined
  if (Array.isArray(arr)) return arr.length ? arr[arr.length - 1] : undefined
  // If it's an iterable but not an array, attempt to get the last element
  try {
    let lastVal
    for (const v of arr) lastVal = v
    return lastVal
  } catch (e) {
    return undefined
  }
}

module.exports = { last }

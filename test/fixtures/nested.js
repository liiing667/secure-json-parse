'use strict'

/**
 * @description Builds a deeply nested object graph with a shared leaf and a back edge.
 * @param {number} [depth=1000] - Number of nested levels to create.
 * @returns {Object} The root of the nested graph; each level reuses the same
 * `leaf` sub-object, and the deepest level links back to the root, making the
 * graph cyclic as well as deeply nested.
 */
function buildNestedGraph (depth = 1000) {
  const root = { level: 0 }
  const leaf = { name: 'leaf' }
  let node = root

  for (let level = 1; level <= depth; level++) {
    node.child = {
      level,
      leaf
    }
    node = node.child
  }

  node.deepest = true
  node.backRef = root
  root.leaf = leaf

  return root
}

module.exports = {
  buildNestedGraph
}

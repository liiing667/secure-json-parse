'use strict'

/**
 * @description Builds an object graph with circular references and shared sub-objects.
 * @returns {Object} A cyclic graph: `root.self` points back to `root`, while both
 * `root.a.shared` and `root.b.shared` reference the same sub-object, which itself
 * points back to `root`.
 */
function buildCyclicGraph () {
  const root = { name: 'root' }
  const shared = { name: 'shared' }

  root.self = root
  root.a = { shared }
  root.b = { shared }
  shared.backRef = root
  root.list = [root, shared, { leaf: true }]

  return root
}

/**
 * @description Builds a cyclic graph carrying forbidden prototype keys.
 * @returns {Object} A cyclic graph whose nested object defines an own `__proto__`
 * data property and whose `constructor` value has an own `prototype` property.
 */
function buildCyclicProtoGraph () {
  const root = { name: 'root' }
  const nested = JSON.parse('{ "__proto__": { "x": 7 } }')

  root.self = root
  root.nested = nested
  nested.owner = root
  root.ctor = { constructor: { prototype: { bar: 'baz' } } }

  return root
}

module.exports = {
  buildCyclicGraph,
  buildCyclicProtoGraph
}

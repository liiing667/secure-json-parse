'use strict'

const { test } = require('tape')
const j = require('..')
const { buildCyclicGraph, buildCyclicProtoGraph } = require('./fixtures/cyclic')
const { buildNestedGraph } = require('./fixtures/nested')

test('parse', t => {
  t.test('parses object string', t => {
    t.deepEqual(
      j.parse('{"a": 5, "b": 6}'),
      JSON.parse('{"a": 5, "b": 6}')
    )
    t.end()
  })

  t.test('parses null string', t => {
    t.strictEqual(
      j.parse('null'),
      JSON.parse('null')
    )
    t.end()
  })

  t.test('parses 0 string', t => {
    t.strictEqual(
      j.parse('0'),
      JSON.parse('0')
    )
    t.end()
  })

  t.test('parses string string', t => {
    t.strictEqual(
      j.parse('"X"'),
      JSON.parse('"X"')
    )
    t.end()
  })

  t.test('parses buffer', t => {
    t.strictEqual(
      j.parse(Buffer.from('"X"')),
      JSON.parse(Buffer.from('"X"'))
    )
    t.end()
  })

  t.test('parses object string (reviver)', t => {
    const reviver = (_key, value) => {
      return typeof value === 'number' ? value + 1 : value
    }

    t.deepEqual(
      j.parse('{"a": 5, "b": 6}', reviver),
      JSON.parse('{"a": 5, "b": 6}', reviver)
    )
    t.end()
  })

  t.test('protoAction', t => {
    t.test('sanitizes object string (reviver, options)', t => {
      const reviver = (_key, value) => {
        return typeof value === 'number' ? value + 1 : value
      }

      t.deepEqual(
        j.parse('{"a": 5, "b": 6,"__proto__": { "x": 7 }}', reviver, { protoAction: 'remove' }),
        { a: 6, b: 7 }
      )
      t.end()
    })

    t.test('sanitizes object string (options)', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": 6,"__proto__": { "x": 7 }}', { protoAction: 'remove' }),
        { a: 5, b: 6 }
      )
      t.end()
    })

    t.test('sanitizes object string (null, options)', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": 6,"__proto__": { "x": 7 }}', null, { protoAction: 'remove' }),
        { a: 5, b: 6 }
      )
      t.end()
    })

    t.test('sanitizes object string (null, options)', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": 6,"__proto__": { "x": 7 }}', { protoAction: 'remove' }),
        { a: 5, b: 6 }
      )
      t.end()
    })

    t.test('sanitizes nested object string', t => {
      t.deepEqual(
        j.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }', { protoAction: 'remove' }),
        { a: 5, b: 6, c: { d: 0, e: 'text', f: { g: 2 } } }
      )
      t.end()
    })

    t.test('ignores proto property', t => {
      t.deepEqual(
        j.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }', { protoAction: 'ignore' }),
        JSON.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }')
      )
      t.end()
    })

    t.test('ignores proto value', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": "__proto__"}'),
        { a: 5, b: '__proto__' }
      )
      t.end()
    })

    t.test('errors on proto property', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "__proto__" : { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "__proto__" \n\r\t : { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "__proto__" \n \r \t : { "x": 7 } }'), SyntaxError)
      t.end()
    })

    t.test('errors on proto property (null, null)', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }', null, null), SyntaxError)
      t.end()
    })

    t.test('errors on proto property (explicit options)', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }', { protoAction: 'error' }), SyntaxError)
      t.end()
    })

    t.test('errors on proto property (unicode)', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u005f_proto__": { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "_\\u005fp\\u0072oto__": { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u005f\\u005f\\u0070\\u0072\\u006f\\u0074\\u006f\\u005f\\u005f": { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u005F_proto__": { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "_\\u005Fp\\u0072oto__": { "x": 7 } }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u005F\\u005F\\u0070\\u0072\\u006F\\u0074\\u006F\\u005F\\u005F": { "x": 7 } }'), SyntaxError)
      t.end()
    })

    t.test('should reset stackTraceLimit', t => {
      const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'
      Error.stackTraceLimit = 42
      t.throws(() => j.parse(text))
      t.same(Error.stackTraceLimit, 42)
      t.end()
    })

    t.end()
  })

  t.test('constructorAction', t => {
    t.test('sanitizes object string (reviver, options)', t => {
      const reviver = (_key, value) => {
        return typeof value === 'number' ? value + 1 : value
      }

      t.deepEqual(
        j.parse('{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }', reviver, { constructorAction: 'remove' }),
        { a: 6, b: 7 }
      )
      t.end()
    })

    t.test('sanitizes object string (options)', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }', { constructorAction: 'remove' }),
        { a: 5, b: 6 }
      )
      t.end()
    })

    t.test('sanitizes object string (null, options)', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": 6,"constructor":{"prototype":{"bar":"baz"}} }', null, { constructorAction: 'remove' }),
        { a: 5, b: 6 }
      )
      t.end()
    })

    t.test('sanitizes object string (null, options)', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": 6,"constructor":{"prototype":{"bar":"baz"}} }', { constructorAction: 'remove' }),
        { a: 5, b: 6 }
      )
      t.end()
    })

    t.test('sanitizes object string (no prototype key)', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": 6,"constructor":{"bar":"baz"} }', { constructorAction: 'remove' }),
        { a: 5, b: 6, constructor: { bar: 'baz' } }
      )
      t.end()
    })

    t.test('sanitizes nested object string', t => {
      t.deepEqual(
        j.parse('{ "a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "c": { "d": 0, "e": "text", "constructor":{"prototype":{"bar":"baz"}}, "f": { "g": 2 } } }', { constructorAction: 'remove' }),
        { a: 5, b: 6, c: { d: 0, e: 'text', f: { g: 2 } } }
      )
      t.end()
    })

    t.test('ignores proto property', t => {
      t.deepEqual(
        j.parse('{ "a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }', { constructorAction: 'ignore' }),
        JSON.parse('{ "a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }')
      )
      t.end()
    })

    t.test('ignores proto value', t => {
      t.deepEqual(
        j.parse('{"a": 5, "b": "constructor"}'),
        { a: 5, b: 'constructor' }
      )
      t.end()
    })

    t.test('errors on proto property', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "constructor": {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "constructor" : {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "constructor" \n\r\t : {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "constructor" \n \r \t : {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.end()
    })

    t.test('Should not throw if the constructor key hasn\'t a child named prototype', t => {
      t.doesNotThrow(() => j.parse('{ "a": 5, "b": 6, "constructor":{"bar":"baz"} }', null, null), SyntaxError)
      t.end()
    })

    t.test('errors on proto property (null, null)', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }', null, null), SyntaxError)
      t.end()
    })

    t.test('errors on proto property (explicit options)', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }', { constructorAction: 'error' }), SyntaxError)
      t.end()
    })

    t.test('errors on proto property (unicode)', t => {
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u0063\\u006fnstructor": {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u0063\\u006f\\u006e\\u0073\\u0074ructor": {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u0063\\u006f\\u006e\\u0073\\u0074\\u0072\\u0075\\u0063\\u0074\\u006f\\u0072": {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u0063\\u006Fnstructor": {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.throws(() => j.parse('{ "a": 5, "b": 6, "\\u0063\\u006F\\u006E\\u0073\\u0074\\u0072\\u0075\\u0063\\u0074\\u006F\\u0072": {"prototype":{"bar":"baz"}} }'), SyntaxError)
      t.end()
    })

    t.test('handles constructor null safely', t => {
      // Test that constructor: null doesn't trigger prototype pollution checks
      t.deepEqual(
        j.parse('{"constructor": null}', { constructorAction: 'remove' }),
        { constructor: null }
      )

      // Test that constructor: null doesn't throw error when using error action
      t.deepEqual(
        j.parse('{"constructor": null}', { constructorAction: 'error' }),
        { constructor: null }
      )

      // Test that constructor: null is preserved when using ignore action
      t.deepEqual(
        j.parse('{"constructor": null}', { constructorAction: 'ignore' }),
        { constructor: null }
      )
      t.end()
    })

    t.end()
  })

  t.test('protoAction and constructorAction', t => {
    t.test('protoAction=remove constructorAction=remove', t => {
      t.deepEqual(
        j.parse(
          '{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }',
          { protoAction: 'remove', constructorAction: 'remove' }
        ),
        { a: 5, b: 6 }
      )
      t.end()
    })

    t.test('protoAction=ignore constructorAction=remove', t => {
      t.deepEqual(
        j.parse(
          '{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }',
          { protoAction: 'ignore', constructorAction: 'remove' }
        ),
        JSON.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }')
      )
      t.end()
    })

    t.test('protoAction=remove constructorAction=ignore', t => {
      t.deepEqual(
        j.parse(
          '{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }',
          { protoAction: 'remove', constructorAction: 'ignore' }
        ),
        JSON.parse('{ "a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }')
      )
      t.end()
    })

    t.test('protoAction=ignore constructorAction=ignore', t => {
      t.deepEqual(
        j.parse(
          '{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }',
          { protoAction: 'ignore', constructorAction: 'ignore' }
        ),
        JSON.parse('{ "a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }')
      )
      t.end()
    })

    t.test('protoAction=error constructorAction=ignore', t => {
      t.throws(() => j.parse(
        '{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }',
        { protoAction: 'error', constructorAction: 'ignore' }
      ), SyntaxError)
      t.end()
    })

    t.test('protoAction=ignore constructorAction=error', t => {
      t.throws(() => j.parse(
        '{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }',
        { protoAction: 'ignore', constructorAction: 'error' }
      ), SyntaxError)
      t.end()
    })

    t.test('protoAction=error constructorAction=error', t => {
      t.throws(() => j.parse(
        '{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}}, "__proto__": { "x": 7 } }',
        { protoAction: 'error', constructorAction: 'error' }
      ), SyntaxError)
      t.end()
    })

    t.end()
  })

  t.test('sanitizes nested object string', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    const obj = j.parse(text, { protoAction: 'remove' })
    t.deepEqual(obj, { a: 5, b: 6, c: { d: 0, e: 'text', f: { g: 2 } } })
    t.end()
  })

  t.test('errors on constructor property', t => {
    const text = '{ "a": 5, "b": 6, "constructor": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    t.throws(() => j.parse(text), SyntaxError)
    t.end()
  })

  t.test('errors on proto property', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    t.throws(() => j.parse(text), SyntaxError)
    t.end()
  })

  t.test('errors on constructor property', t => {
    const text = '{ "a": 5, "b": 6, "constructor": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    t.throws(() => j.parse(text), SyntaxError)
    t.end()
  })

  t.test('does not break when hasOwnProperty is overwritten', t => {
    const text = '{ "a": 5, "b": 6, "hasOwnProperty": "text", "__proto__": { "x": 7 } }'

    const obj = j.parse(text, { protoAction: 'remove' })
    t.deepEqual(obj, { a: 5, b: 6, hasOwnProperty: 'text' })
    t.end()
  })
  t.end()
})

test('safeParse', t => {
  t.test('parses buffer', t => {
    t.strictEqual(
      j.safeParse(Buffer.from('"X"')),
      JSON.parse(Buffer.from('"X"'))
    )
    t.end()
  })

  t.test('should reset stackTraceLimit', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'
    Error.stackTraceLimit = 42
    t.same(j.safeParse(text), null)
    t.same(Error.stackTraceLimit, 42)
    t.end()
  })

  t.test('sanitizes nested object string', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    t.same(j.safeParse(text), null)
    t.end()
  })

  t.test('returns null on constructor property', t => {
    const text = '{ "a": 5, "b": 6, "constructor": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    t.same(j.safeParse(text), null)
    t.end()
  })

  t.test('returns null on proto property', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    t.same(j.safeParse(text), null)
    t.end()
  })

  t.test('returns null on constructor property', t => {
    const text = '{ "a": 5, "b": 6, "constructor": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }'

    t.same(j.safeParse(text), null)
    t.end()
  })

  t.test('parses object string', t => {
    t.deepEqual(
      j.safeParse('{"a": 5, "b": 6}'),
      { a: 5, b: 6 }
    )
    t.end()
  })

  t.test('returns null on proto object string', t => {
    t.strictEqual(
      j.safeParse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'),
      null
    )
    t.end()
  })

  t.test('returns undefined on invalid object string and resets stackTraceLimit', t => {
    Error.stackTraceLimit = 42
    t.strictEqual(
      j.safeParse('{"a": 5, "b": 6'),
      undefined
    )
    t.strictEqual(Error.stackTraceLimit, 42)
    t.end()
  })

  t.test('sanitizes object string (options)', t => {
    t.deepEqual(
      j.safeParse('{"a": 5, "b": 6, "constructor":{"prototype":{"bar":"baz"}} }'),
      null
    )
    t.end()
  })

  t.test('sanitizes object string (no prototype key)', t => {
    t.deepEqual(
      j.safeParse('{"a": 5, "b": 6,"constructor":{"bar":"baz"} }'),
      { a: 5, b: 6, constructor: { bar: 'baz' } }
    )
    t.end()
  })

  t.end()
})

test('parse string with BOM', t => {
  const theJson = { hello: 'world' }
  const buffer = Buffer.concat([
    Buffer.from([239, 187, 191]), // the utf8 BOM
    Buffer.from(JSON.stringify(theJson))
  ])
  t.deepEqual(j.parse(buffer.toString()), theJson)
  t.end()
})

test('parse buffer with BOM', t => {
  const theJson = { hello: 'world' }
  const buffer = Buffer.concat([
    Buffer.from([239, 187, 191]), // the utf8 BOM
    Buffer.from(JSON.stringify(theJson))
  ])
  t.deepEqual(j.parse(buffer), theJson)
  t.end()
})

test('safeParse string with BOM', t => {
  const theJson = { hello: 'world' }
  const buffer = Buffer.concat([
    Buffer.from([239, 187, 191]), // the utf8 BOM
    Buffer.from(JSON.stringify(theJson))
  ])
  t.deepEqual(j.safeParse(buffer.toString()), theJson)
  t.end()
})

test('safeParse buffer with BOM', t => {
  const theJson = { hello: 'world' }
  const buffer = Buffer.concat([
    Buffer.from([239, 187, 191]), // the utf8 BOM
    Buffer.from(JSON.stringify(theJson))
  ])
  t.deepEqual(j.safeParse(buffer), theJson)
  t.end()
})

test('scan handles optional options', t => {
  t.doesNotThrow(() => j.scan({ a: 'b' }))
  t.end()
})

test('safe option', t => {
  t.test('parse with safe=true returns null on __proto__', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'
    t.strictEqual(j.parse(text, { safe: true }), null)
    t.end()
  })

  t.test('parse with safe=true returns null on constructor', t => {
    const text = '{ "a": 5, "b": 6, "constructor": {"prototype": {"bar": "baz"}} }'
    t.strictEqual(j.parse(text, { safe: true }), null)
    t.end()
  })

  t.test('parse with safe=true returns object when valid', t => {
    const text = '{ "a": 5, "b": 6 }'
    t.deepEqual(j.parse(text, { safe: true }), { a: 5, b: 6 })
    t.end()
  })

  t.test('parse with safe=true and reviver', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'
    const reviver = (_key, value) => {
      return typeof value === 'number' ? value + 1 : value
    }
    t.strictEqual(j.parse(text, reviver, { safe: true }), null)
    t.end()
  })

  t.test('parse with safe=true and protoAction=remove returns null', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'
    t.strictEqual(j.parse(text, { safe: true, protoAction: 'remove' }), null)
    t.end()
  })

  t.test('parse with safe=true and constructorAction=remove returns null', t => {
    const text = '{ "a": 5, "b": 6, "constructor": {"prototype": {"bar": "baz"}} }'
    t.strictEqual(j.parse(text, { safe: true, constructorAction: 'remove' }), null)
    t.end()
  })

  t.test('parse with safe=false throws on __proto__', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'
    t.throws(() => j.parse(text, { safe: false }), SyntaxError)
    t.end()
  })

  t.test('parse with safe=false throws on constructor', t => {
    const text = '{ "a": 5, "b": 6, "constructor": {"prototype": {"bar": "baz"}} }'
    t.throws(() => j.parse(text, { safe: false }), SyntaxError)
    t.end()
  })

  t.test('scan with safe=true returns null on __proto__', t => {
    const obj = JSON.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }')
    t.strictEqual(j.scan(obj, { safe: true }), null)
    t.end()
  })

  t.test('scan with safe=true returns null on constructor', t => {
    const obj = JSON.parse('{ "a": 5, "b": 6, "constructor": {"prototype": {"bar": "baz"}} }')
    t.strictEqual(j.scan(obj, { safe: true }), null)
    t.end()
  })

  t.test('scan with safe=true returns object when valid', t => {
    const obj = { a: 5, b: 6 }
    t.deepEqual(j.scan(obj, { safe: true }), { a: 5, b: 6 })
    t.end()
  })

  t.test('scan with safe=false throws on __proto__', t => {
    const obj = JSON.parse('{ "a": 5, "b": 6, "__proto__": { "x": 7 } }')
    t.throws(() => j.scan(obj, { safe: false }), SyntaxError)
    t.end()
  })

  t.test('scan with safe=false throws on constructor', t => {
    const obj = JSON.parse('{ "a": 5, "b": 6, "constructor": {"prototype": {"bar": "baz"}} }')
    t.throws(() => j.scan(obj, { safe: false }), SyntaxError)
    t.end()
  })

  t.test('parse with safe=true returns null on nested __proto__', t => {
    const text = '{ "a": 5, "c": { "d": 0, "__proto__": { "y": 8 } } }'
    t.strictEqual(j.parse(text, { safe: true }), null)
    t.end()
  })

  t.test('parse with safe=true returns null on nested constructor', t => {
    const text = '{ "a": 5, "c": { "d": 0, "constructor": {"prototype": {"bar": "baz"}} } }'
    t.strictEqual(j.parse(text, { safe: true }), null)
    t.end()
  })

  t.test('parse with safe=true and protoAction=ignore returns object', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'
    t.deepEqual(
      j.parse(text, { safe: true, protoAction: 'ignore' }),
      JSON.parse(text)
    )
    t.end()
  })

  t.test('parse with safe=true and constructorAction=ignore returns object', t => {
    const text = '{ "a": 5, "b": 6, "constructor": {"prototype": {"bar": "baz"}} }'
    t.deepEqual(
      j.parse(text, { safe: true, constructorAction: 'ignore' }),
      JSON.parse(text)
    )
    t.end()
  })

  t.test('should reset stackTraceLimit with safe option', t => {
    const text = '{ "a": 5, "b": 6, "__proto__": { "x": 7 } }'
    Error.stackTraceLimit = 42
    t.strictEqual(j.parse(text, { safe: true }), null)
    t.same(Error.stackTraceLimit, 42)
    t.end()
  })

  t.end()
})

test('scan terminates on cyclic and shared object graphs', t => {
  t.timeoutAfter(2000)

  t.test('visits each object once and returns the same graph', t => {
    const obj = buildCyclicGraph()

    t.strictEqual(j.scan(obj), obj)
    t.strictEqual(obj.self, obj)
    t.strictEqual(obj.a.shared, obj.b.shared)
    t.strictEqual(obj.a.shared.backRef, obj)
    t.strictEqual(obj.list[0], obj)
    t.strictEqual(obj.list[1], obj.a.shared)
    t.end()
  })

  t.test('does not duplicate shared sub-objects', t => {
    const obj = buildCyclicGraph()

    j.scan(obj)
    t.strictEqual(obj.a.shared, obj.b.shared)
    t.strictEqual(obj.leaf, undefined)
    t.end()
  })

  t.test('does not mutate the prototype of prototype-chained objects', t => {
    const proto = { inherited: true }
    const child = Object.create(proto)
    child.own = 1
    child.self = child

    t.strictEqual(j.scan(child), child)
    t.strictEqual(Object.getPrototypeOf(child), proto)
    t.strictEqual(child.inherited, true)
    t.strictEqual(Object.prototype.hasOwnProperty.call(child, 'own'), true)
    t.end()
  })

  t.test('terminates on deeply nested graphs with back edges', t => {
    const obj = buildNestedGraph(1000)

    t.strictEqual(j.scan(obj), obj)
    t.strictEqual(obj.leaf, obj.child.leaf)

    let node = obj
    let depth = 0
    while (node.child) {
      node = node.child
      depth++
    }
    t.strictEqual(depth, 1000)
    t.strictEqual(node.backRef, obj)
    t.end()
  })

  t.test('keeps error semantics for forbidden keys inside cyclic graphs', t => {
    const obj = buildCyclicProtoGraph()

    t.throws(() => j.scan(obj), SyntaxError)
    t.strictEqual(obj.self, obj)
    t.end()
  })

  t.test('keeps remove semantics inside cyclic graphs', t => {
    const obj = buildCyclicProtoGraph()

    t.doesNotThrow(() => j.scan(obj, {
      protoAction: 'remove',
      constructorAction: 'remove'
    }))
    t.strictEqual(
      Object.prototype.hasOwnProperty.call(obj.nested, '__proto__'),
      false
    )
    t.strictEqual(
      Object.prototype.hasOwnProperty.call(obj.ctor, 'constructor'),
      false
    )
    t.strictEqual(obj.self, obj)
    t.strictEqual(obj.nested.owner, obj)
    t.end()
  })

  t.test('keeps safe semantics inside cyclic graphs', t => {
    const obj = buildCyclicProtoGraph()

    t.strictEqual(j.scan(obj, { safe: true }), null)
    t.strictEqual(obj.self, obj)
    t.end()
  })

  t.test('respects ignore actions inside cyclic graphs', t => {
    const obj = buildCyclicProtoGraph()

    t.strictEqual(
      j.scan(obj, { protoAction: 'ignore', constructorAction: 'ignore' }),
      obj
    )
    t.strictEqual(
      Object.prototype.hasOwnProperty.call(obj.nested, '__proto__'),
      true
    )
    t.strictEqual(obj.self, obj)
    t.end()
  })

  t.end()
})

test('parse with reviver handles cyclic and shared graphs', t => {
  t.timeoutAfter(2000)

  t.test('reviver creating a circular graph does not hang', t => {
    const text = '{"a": {"x": 1}, "b": {"y": 2}}'
    const reviver = function (key, value) {
      if (key === 'b') {
        value.loop = this.a
      }
      if (key === '' && value && typeof value === 'object') {
        value.rootRef = value
      }
      return value
    }

    const result = j.parse(text, reviver)
    t.strictEqual(result.rootRef, result)
    t.strictEqual(result.b.loop, result.a)
    t.end()
  })

  t.test('reviver creating shared references keeps remove semantics', t => {
    const text = '{"a": {"x": 1}, "b": {"__proto__": {"z": 9}}, "c": {"y": 2}}'
    const reviver = function (key, value) {
      if (key === 'c') {
        value.shared = this.a
      }
      if (key === '') {
        value.loop = value
      }
      return value
    }

    const result = j.parse(text, reviver, { protoAction: 'remove' })
    t.strictEqual(result.loop, result)
    t.strictEqual(result.c.shared, result.a)
    t.strictEqual(
      Object.prototype.hasOwnProperty.call(result.b, '__proto__'),
      false
    )
    t.end()
  })

  t.test('reviver creating a circular graph keeps safe semantics', t => {
    const text = '{"a": {"x": 1}, "__proto__": {"z": 9}}'
    const reviver = function (key, value) {
      if (key === 'a') {
        value.loop = this
      }
      return value
    }

    t.strictEqual(j.parse(text, reviver, { safe: true }), null)
    t.strictEqual(j.safeParse(text, reviver), null)
    t.end()
  })

  t.test('reviver creating shared sub-objects does not copy them', t => {
    const text = '{"a": {"x": 1}, "b": {"y": 2}, "c": {"z": 3}}'
    const reviver = function (key, value) {
      if (key === 'b' || key === 'c') {
        value.ref = this.a
      }
      return value
    }

    const result = j.parse(text, reviver)
    t.strictEqual(result.b.ref, result.a)
    t.strictEqual(result.c.ref, result.a)
    t.strictEqual(result.b.ref, result.c.ref)
    t.end()
  })

  t.end()
})

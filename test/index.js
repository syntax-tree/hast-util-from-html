/**
 * @typedef {import('vfile-message').VFileMessage} VFileMessage
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'tape'
import {VFile} from 'vfile'
import {toVFile, read} from 'to-vfile'
import {fromHtml} from '../index.js'
import {errors as rerrors} from '../lib/errors.js'

test('hast-util-from-html', (t) => {
  t.deepEqual(
    fromHtml('a'),
    {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'html',
          properties: {},
          children: [
            {type: 'element', tagName: 'head', properties: {}, children: []},
            {
              type: 'element',
              tagName: 'body',
              properties: {},
              children: [
                {
                  type: 'text',
                  value: 'a',
                  position: {
                    start: {line: 1, column: 1, offset: 0},
                    end: {line: 1, column: 2, offset: 1}
                  }
                }
              ]
            }
          ]
        }
      ],
      data: {quirksMode: true},
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 2, offset: 1}
      }
    },
    'should work'
  )

  t.deepEqual(
    fromHtml('a', {fragment: true}),
    {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'a',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 2, offset: 1}
          }
        }
      ],
      data: {quirksMode: false},
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 2, offset: 1}
      }
    },
    'should support `options.fragment`'
  )

  /** @type {unknown} */
  let args

  fromHtml('a', {
    onerror(...parameters) {
      args = parameters
    }
  })

  t.deepEqual(
    JSON.parse(JSON.stringify(args)),
    [
      {
        name: '1:1-1:1',
        message: 'Missing doctype before other content',
        reason: 'Missing doctype before other content',
        line: 1,
        column: 1,
        source: 'parse-error',
        ruleId: 'missing-doctype',
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 1, column: 1, offset: 0}
        },
        fatal: false,
        note: 'Expected a `<!doctype html>` before anything else',
        url: null
      }
    ],
    'should support `options.onerror`'
  )

  args = undefined
  fromHtml('a', {
    onerror(...parameters) {
      args = parameters
    },
    missingDoctype: 0
  })

  t.deepEqual(
    JSON.stringify(args),
    undefined,
    'should support `options.*` to level warnings (w/ numbers)'
  )

  args = undefined
  fromHtml('a', {
    onerror(...parameters) {
      args = parameters
    },
    missingDoctype: false
  })

  t.deepEqual(
    JSON.stringify(args),
    undefined,
    'should support `options.*` to level warnings (w/ booleans)'
  )

  args = undefined
  fromHtml('&x;', {
    onerror(...parameters) {
      args = parameters
    },
    missingDoctype: false
  })

  t.deepEqual(
    JSON.parse(JSON.stringify(args)),
    [
      {
        name: '1:3-1:3',
        message: 'Unexpected unknown named character reference',
        reason: 'Unexpected unknown named character reference',
        line: 1,
        column: 3,
        source: 'parse-error',
        ruleId: 'unknown-named-character-reference',
        position: {
          start: {line: 1, column: 3, offset: 2},
          end: {line: 1, column: 3, offset: 2}
        },
        fatal: false,
        note: 'Unexpected character reference. Expected known named character references',
        url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unknown-named-character-reference'
      }
    ],
    'should support warnings with URLs'
  )

  args = undefined
  fromHtml('</x/>', {
    onerror(...parameters) {
      args = parameters
    },
    missingDoctype: false
  })

  t.deepEqual(
    JSON.parse(JSON.stringify(args)),
    [
      {
        name: '1:5-1:5',
        message: 'Unexpected slash at end of closing tag',
        reason: 'Unexpected slash at end of closing tag',
        line: 1,
        column: 5,
        source: 'parse-error',
        ruleId: 'end-tag-with-trailing-solidus',
        position: {
          start: {line: 1, column: 5, offset: 4},
          end: {line: 1, column: 5, offset: 4}
        },
        fatal: false,
        note: 'Unexpected `/`. Expected `>` instead',
        url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-end-tag-with-trailing-solidus'
      }
    ],
    'should support warnings with character codes'
  )

  args = undefined
  fromHtml('<`>', {
    onerror(...parameters) {
      args = parameters
    },
    missingDoctype: false
  })

  t.deepEqual(
    JSON.parse(JSON.stringify(args)),
    [
      {
        name: '1:2-1:2',
        message: 'Invalid first character in tag name',
        reason: 'Invalid first character in tag name',
        line: 1,
        column: 2,
        source: 'parse-error',
        ruleId: 'invalid-first-character-of-tag-name',
        position: {
          start: {line: 1, column: 2, offset: 1},
          end: {line: 1, column: 2, offset: 1}
        },
        fatal: false,
        note: 'Unexpected `` ` ``. Expected an ASCII letter instead',
        url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-invalid-first-character-of-tag-name'
      }
    ],
    'should support warnings with character codes (`` ` ``)'
  )

  args = undefined
  fromHtml('\0', {
    onerror(...parameters) {
      args = parameters
    },
    missingDoctype: false
  })

  t.deepEqual(
    JSON.parse(JSON.stringify(args)),
    [
      {
        name: '1:1-1:1',
        message: 'Unexpected NULL character',
        reason: 'Unexpected NULL character',
        line: 1,
        column: 1,
        source: 'parse-error',
        ruleId: 'unexpected-null-character',
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 1, column: 1, offset: 0}
        },
        fatal: false,
        note: 'Unexpected code point `0x0`. Do not use NULL characters in HTML',
        url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-null-character'
      }
    ],
    'should support warnings with decimal character codes'
  )

  args = undefined
  fromHtml(new VFile({value: '</x/>', path: 'example.html'}), {
    onerror(...parameters) {
      args = parameters
    }
  })

  t.deepEqual(
    JSON.parse(JSON.stringify(args)),
    [
      {
        name: 'example.html:1:1-1:1',
        message: 'Missing doctype before other content',
        reason: 'Missing doctype before other content',
        line: 1,
        column: 1,
        source: 'parse-error',
        ruleId: 'missing-doctype',
        position: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 1, column: 1, offset: 0}
        },
        file: 'example.html',
        fatal: false,
        note: 'Expected a `<!doctype html>` before anything else',
        url: null
      }
    ],
    'should support vfiles'
  )

  t.end()
})

// Related to https://github.com/inikulin/parse5/issues/255
// and https://github.com/inikulin/parse5/pull/257.
test('parse errors: coverage', async (t) => {
  await fs.writeFile(
    new URL('error-codes-from-p5.js', import.meta.url),
    '// @ts-nocheck\n/** @type {Record<string, string>} */\n' +
      String(
        await fs.readFile(
          new URL(
            '../node_modules/parse5/dist/common/error-codes.js',
            import.meta.url
          )
        )
      )
  )

  /** @type {{ERR: Record<string, string>}} */
  // @ts-ignore: this errors when tests did not run before build.
  const {ERR: p5errors} = await import('./error-codes-from-p5.js')

  t.deepEqual(
    Object.keys(p5errors).sort(),
    Object.keys(rerrors).sort(),
    'all codes from `parse5` should be covered by `hast-util-from-html`'
  )

  t.end()
})

test('parse-errors: working', async (t) => {
  let index = -1
  const root = path.join('test', 'parse-error')
  const fixtures = await fs.readdir(root)

  t.test('surrogate-in-input-stream', (t) => {
    const file = toVFile({
      path: 'index.html',
      value: '<!doctype html>\n' + String.fromCharCode(0xd8_00)
    })

    /** @type {Array<VFileMessage>} */
    const actual = []

    fromHtml(file, {
      onerror(message) {
        actual.push(message)
      }
    })

    t.deepEqual(
      JSON.parse(JSON.stringify(actual)),
      [
        {
          message: 'Unexpected surrogate character',
          name: 'index.html:2:1-2:1',
          reason: 'Unexpected surrogate character',
          line: 2,
          column: 1,
          position: {
            start: {line: 2, column: 1, offset: 16},
            end: {line: 2, column: 1, offset: 16}
          },
          source: 'parse-error',
          ruleId: 'surrogate-in-input-stream',
          file: 'index.html',
          fatal: false,
          note: 'Unexpected code point `0xD800`. Do not use lone surrogate characters in HTML',
          url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-surrogate-in-input-stream'
        }
      ],
      'should emit messages'
    )

    t.end()
  })

  /* Check the next fixture. */
  function next() {
    const fixture = fixtures[++index]

    if (!fixture) {
      return
    }

    if (fixture.charAt(0) === '.') {
      setImmediate(next)
      return
    }

    const fp = path.join(root, fixture)

    setImmediate(next) // Queue next.

    t.test(fixture, async (t) => {
      const file = await read(path.join(fp, 'index.html'), 'utf8')
      /** @type {Array<Error>} */
      const messages = JSON.parse(
        String(await fs.readFile(path.join(fp, 'messages.json')))
      )

      file.dirname = ''
      /** @type {Array<VFileMessage>} */
      const actual = []

      fromHtml(file, {
        onerror(message) {
          actual.push(message)
        }
      })

      t.deepEqual(
        JSON.parse(JSON.stringify(actual)),
        messages,
        'should emit messages for `' + fixture + '`'
      )

      t.end()
    })
  }

  next()
})

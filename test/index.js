/**
 * @typedef {import('vfile-message').VFileMessage} VFileMessage
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import {read} from 'to-vfile'
import {VFile} from 'vfile'
import {errors as rerrors} from '../lib/errors.js'
import {fromHtml} from '../index.js'

test('fromHtml', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../index.js')).sort(), [
      'fromHtml'
    ])
  })

  await t.test('should work', async function () {
    assert.deepEqual(fromHtml('a'), {
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
    })
  })

  await t.test('should support `options.fragment`', async function () {
    assert.deepEqual(fromHtml('a', {fragment: true}), {
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
    })
  })

  await t.test('should support `options.onerror`', async function () {
    /** @type {unknown} */
    let args

    fromHtml('a', {
      onerror(...parameters) {
        args = parameters
      }
    })

    assert.deepEqual(JSON.parse(JSON.stringify(args)), [
      {
        column: 1,
        fatal: false,
        message: 'Missing doctype before other content',
        line: 1,
        name: '1:1-1:1',
        place: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 1, column: 1, offset: 0}
        },
        reason: 'Missing doctype before other content',
        ruleId: 'missing-doctype',
        source: 'hast-util-from-html',
        note: 'Expected a `<!doctype html>` before anything else'
      }
    ])
  })

  await t.test(
    'should support `options.*` to level warnings (w/ numbers)',
    async function () {
      /** @type {unknown} */
      let args

      fromHtml('a', {
        onerror(...parameters) {
          args = parameters
        },
        missingDoctype: 0
      })

      assert.deepEqual(JSON.stringify(args), undefined)
    }
  )

  await t.test(
    'should support `options.*` to level warnings (w/ booleans)',
    async function () {
      /** @type {unknown} */
      let args

      fromHtml('a', {
        onerror(...parameters) {
          args = parameters
        },
        missingDoctype: false
      })

      assert.deepEqual(JSON.stringify(args), undefined)
    }
  )

  await t.test('should support warnings with URLs', async function () {
    /** @type {unknown} */
    let args

    fromHtml('&x;', {
      onerror(...parameters) {
        args = parameters
      },
      missingDoctype: false
    })

    assert.deepEqual(JSON.parse(JSON.stringify(args)), [
      {
        column: 3,
        fatal: false,
        message: 'Unexpected unknown named character reference',
        line: 1,
        name: '1:3-1:3',
        place: {
          start: {line: 1, column: 3, offset: 2},
          end: {line: 1, column: 3, offset: 2}
        },
        reason: 'Unexpected unknown named character reference',
        ruleId: 'unknown-named-character-reference',
        source: 'hast-util-from-html',
        note: 'Unexpected character reference. Expected known named character references',
        url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unknown-named-character-reference'
      }
    ])
  })

  await t.test(
    'should support warnings with character codes',
    async function () {
      /** @type {unknown} */
      let args

      fromHtml('</x/>', {
        onerror(...parameters) {
          args = parameters
        },
        missingDoctype: false
      })

      assert.deepEqual(JSON.parse(JSON.stringify(args)), [
        {
          column: 5,
          fatal: false,
          message: 'Unexpected slash at end of closing tag',
          line: 1,
          name: '1:5-1:5',
          place: {
            start: {line: 1, column: 5, offset: 4},
            end: {line: 1, column: 5, offset: 4}
          },
          reason: 'Unexpected slash at end of closing tag',
          ruleId: 'end-tag-with-trailing-solidus',
          source: 'hast-util-from-html',
          note: 'Unexpected `/`. Expected `>` instead',
          url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-end-tag-with-trailing-solidus'
        }
      ])
    }
  )

  await t.test(
    'should support warnings with character codes (`` ` ``)',
    async function () {
      /** @type {unknown} */
      let args

      fromHtml('<`>', {
        onerror(...parameters) {
          args = parameters
        },
        missingDoctype: false
      })

      assert.deepEqual(JSON.parse(JSON.stringify(args)), [
        {
          column: 2,
          fatal: false,
          message: 'Invalid first character in tag name',
          line: 1,
          name: '1:2-1:2',
          place: {
            start: {line: 1, column: 2, offset: 1},
            end: {line: 1, column: 2, offset: 1}
          },
          reason: 'Invalid first character in tag name',
          ruleId: 'invalid-first-character-of-tag-name',
          source: 'hast-util-from-html',
          note: 'Unexpected `` ` ``. Expected an ASCII letter instead',
          url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-invalid-first-character-of-tag-name'
        }
      ])
    }
  )

  await t.test(
    'should support warnings with decimal character codes',
    async function () {
      /** @type {unknown} */
      let args

      fromHtml('\0', {
        onerror(...parameters) {
          args = parameters
        },
        missingDoctype: false
      })

      assert.deepEqual(JSON.parse(JSON.stringify(args)), [
        {
          column: 1,
          fatal: false,
          message: 'Unexpected NULL character',
          line: 1,
          name: '1:1-1:1',
          place: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 1, offset: 0}
          },
          reason: 'Unexpected NULL character',
          ruleId: 'unexpected-null-character',
          source: 'hast-util-from-html',
          note: 'Unexpected code point `0x0`. Do not use NULL characters in HTML',
          url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-null-character'
        }
      ])
    }
  )

  await t.test('should support vfiles', async function () {
    /** @type {unknown} */
    let args

    fromHtml(new VFile({value: '</x/>', path: 'example.html'}), {
      onerror(...parameters) {
        args = parameters
      }
    })

    assert.deepEqual(JSON.parse(JSON.stringify(args)), [
      {
        column: 1,
        fatal: false,
        message: 'Missing doctype before other content',
        line: 1,
        name: 'example.html:1:1-1:1',
        place: {
          start: {line: 1, column: 1, offset: 0},
          end: {line: 1, column: 1, offset: 0}
        },
        reason: 'Missing doctype before other content',
        ruleId: 'missing-doctype',
        source: 'hast-util-from-html',
        file: 'example.html',
        note: 'Expected a `<!doctype html>` before anything else'
      }
    ])
  })
})

// Related to https://github.com/inikulin/parse5/issues/255
// and https://github.com/inikulin/parse5/pull/257.
test('parse errors: coverage', async function (t) {
  await t.test(
    'should cover all codes from `parse5` in `hast-util-from-html`',
    async function () {
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

      assert.deepEqual(
        Object.keys(p5errors).sort(),
        Object.keys(rerrors).sort()
      )
    }
  )
})

test('parse-errors: working', async function (t) {
  const root = new URL('parse-error/', import.meta.url)

  await t.test('surrogate-in-input-stream', async function () {
    const file = new VFile({
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

    assert.deepEqual(JSON.parse(JSON.stringify(actual)), [
      {
        column: 1,
        fatal: false,
        message: 'Unexpected surrogate character',
        line: 2,
        name: 'index.html:2:1-2:1',
        place: {
          start: {line: 2, column: 1, offset: 16},
          end: {line: 2, column: 1, offset: 16}
        },
        reason: 'Unexpected surrogate character',
        ruleId: 'surrogate-in-input-stream',
        source: 'hast-util-from-html',
        file: 'index.html',
        note: 'Unexpected code point `0xD800`. Do not use lone surrogate characters in HTML',
        url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-surrogate-in-input-stream'
      }
    ])
  })

  /* Check the next fixture. */
  let index = -1
  const fixtures = await fs.readdir(root)

  while (++index < fixtures.length) {
    const fixture = fixtures[index]

    if (fixture.charAt(0) === '.') {
      continue
    }

    await t.test(fixture, async function () {
      const htmlUrl = new URL(fixture + '/index.html', root)
      const messageUrl = new URL(fixture + '/messages.json', root)
      const file = await read(htmlUrl, 'utf8')
      /** @type {Array<Error>} */
      let expected

      file.dirname = ''
      /** @type {Array<VFileMessage>} */
      const actual = []

      fromHtml(file, {
        onerror(message) {
          actual.push(message)
        }
      })

      try {
        if ('UPDATE' in process.env) {
          throw new Error('Update')
        }

        expected = JSON.parse(String(await fs.readFile(messageUrl)))
      } catch {
        expected = actual

        await fs.writeFile(
          messageUrl,
          JSON.stringify(expected, undefined, 2) + '\n'
        )
      }

      assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected)
    })
  }
})

/**
 * @typedef {import('hast').Root} Root
 * @typedef {import('vfile').VFileCompatible} VFileCompatible
 * @typedef {Pick<import('hast-util-from-parse5').Options, 'space'|'verbose'>} FromParse5Options
 *
 * @typedef {keyof errors} ErrorCode
 * @typedef {0|1|2|boolean|null|undefined} ErrorSeverity
 * @typedef {Partial<Record<ErrorCode, ErrorSeverity>>} ErrorFields
 *
 * @typedef Error
 * @property {string} code
 * @property {number} startLine
 * @property {number} startCol
 * @property {number} startOffset
 * @property {number} endLine
 * @property {number} endCol
 * @property {number} endOffset
 *
 * @callback OnError
 * @param {VFileMessage} error
 * @returns {void}
 *
 * @typedef ParseFields
 * @property {boolean|undefined} [fragment=false]
 *   Specify whether to parse a fragment, instead of a complete document.
 *   In document mode, unopened `html`, `head`, and `body` elements are opened
 *   in just the right places.
 * @property {OnError|undefined} [onerror=false]
 *   > 👉 **Note**: parse errors are currently being added to HTML.
 *   > Not all errors emitted by parse5 (or us) are specced yet.
 *   > Some documentation may still be missing.
 *
 *   Call `onerror` with parse errors while parsing.
 *
 *   Specific rules can be turned off by setting them to `false` (or `0`).
 *   The default, when `emitParseErrors: true`, is `true` (or `1`), and means
 *   that rules emit as warnings.
 *   Rules can also be configured with `2`, to turn them into fatal errors.
 *
 * @typedef {FromParse5Options & ParseFields & ErrorFields} Options
 */

import {parse, parseFragment} from 'parse5'
import {VFile} from 'vfile'
import {VFileMessage} from 'vfile-message'
import {fromParse5} from 'hast-util-from-parse5'
import {errors} from './errors.js'

const base = 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-'

const fatalities = {2: true, 1: false, 0: null}

/**
 * @param {VFileCompatible} value
 * @param {Options} [options={}]
 * @returns {Root}
 */
export function fromHtml(value, options = {}) {
  const warn = options.onerror || null
  const file = value instanceof VFile ? value : new VFile(value)
  const fn = options.fragment ? parseFragment : parse
  const doc = String(file)
  const p5doc = fn(doc, {
    sourceCodeLocationInfo: true,
    onParseError: options.onerror ? onerror : null,
    scriptingEnabled: false
  })

  // @ts-expect-error: `parse5` returns document or fragment, which are always
  // mapped to roots.
  return fromParse5(p5doc, {
    file,
    space: options.space,
    verbose: options.verbose
  })

  /**
   * @param {Error} error
   */
  function onerror(error) {
    const code = error.code
    const name = camelcase(code)
    const setting = options[name]
    const config = setting === undefined || setting === null ? true : setting
    const level = typeof config === 'number' ? config : config ? 1 : 0
    const start = {
      line: error.startLine,
      column: error.startCol,
      offset: error.startOffset
    }
    const end = {
      line: error.endLine,
      column: error.endCol,
      offset: error.endOffset
    }

    if (level) {
      /* c8 ignore next */
      const info = errors[name] || {reason: '', description: '', url: ''}
      const message = new VFileMessage(format(info.reason), {start, end})

      if (file.path) {
        message.name = file.path + ':' + message.name
        message.file = file.path
      }

      message.source = 'parse-error'
      message.ruleId = code
      message.fatal = fatalities[level]
      message.note = format(info.description)
      message.url = 'url' in info && info.url === false ? null : base + code
      // @ts-expect-error: `onerror` is not passed if `warn` is not set.
      warn(message)
    }

    /**
     * @param {string} value
     * @returns {string}
     */
    function format(value) {
      return value
        .replace(
          /%c(?:([-+])(\d+))?/g,
          (_, /** @type {string} */ $1, /** @type {string} */ $2) => {
            const offset =
              ($2 ? Number.parseInt($2, 10) : 0) * ($1 === '-' ? -1 : 1)
            const char = doc.charAt(error.startOffset + offset)
            return char === '`' ? '` ` `' : char
          }
        )
        .replace(
          /%x/g,
          () =>
            '0x' + doc.charCodeAt(error.startOffset).toString(16).toUpperCase()
        )
    }
  }
}

/**
 * @param {string} value
 * @returns {ErrorCode}
 */
function camelcase(value) {
  // @ts-expect-error: fine.
  return value.replace(/-[a-z]/g, ($0) => $0.charAt(1).toUpperCase())
}

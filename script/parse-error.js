/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').ListItem} ListItem
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 */

import fs from 'node:fs/promises'
import {u} from 'unist-builder'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {zone} from 'mdast-zone'
import {errors} from '../lib/errors.js'

const own = {}.hasOwnProperty

/** @type {import('type-fest').PackageJson} */
const packageJson = JSON.parse(String(await fs.readFile('package.json')))

const repo = packageJson.repository

const whatwg =
  'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-'
const base = 'https://github.com/' + repo + '/blob/main'

/** @type {Partial<Record<keyof typeof errors, true>>} */
const ignoreFixture = {
  surrogateInInputStream: true
}

/** @satisfies {import('unified').Plugin<[], Root>} */
export default function remarkParseErrors() {
  /**
   * @param {Root} tree
   *   Tree to transform.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    zone(tree, 'parse-error', function (start, _, end) {
      /** @type {Array<ListItem>} */
      const list = []
      /** @type {keyof typeof errors} */
      let key

      for (key in errors) {
        if (own.call(errors, key)) {
          const info = errors[key]
          const kebab = key.replace(/[A-Z]/g, function ($0) {
            return '-' + $0.toLowerCase()
          })
          const reason =
            info.reason.charAt(0).toLowerCase() + info.reason.slice(1)
          const descriptionRoot = fromMarkdown(reason)
          const headParagraph = descriptionRoot.children[0]

          if (!headParagraph || headParagraph.type !== 'paragraph') {
            throw new Error('Expected paragraph')
          }

          const head = u('inlineCode', key)
          /** @type {Array<PhrasingContent>} */
          const fields = [
            'url' in info && info.url === false
              ? head
              : u('link', {url: whatwg + kebab}, [head]),
            u('text', ' — '),
            ...headParagraph.children
          ]

          if (!ignoreFixture[key]) {
            fields.push(
              u('text', ' ('),
              u(
                'link',
                {url: base + '/test/parse-error/' + kebab + '/index.html'},
                [u('text', 'example')]
              ),
              u('text', ')')
            )
          }

          list.push(u('listItem', [u('paragraph', fields)]))
        }
      }

      return [start, u('list', {ordered: false, spread: false}, list), end]
    })
  }
}

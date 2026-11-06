# hast-util-from-html

[![Build][badge-build-image]][badge-build-url]
[![Coverage][badge-coverage-image]][badge-coverage-url]
[![Downloads][badge-downloads-image]][badge-downloads-url]
[![Size][badge-size-image]][badge-size-url]

[hast][github-hast] utility that turns HTML into a syntax tree.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`fromHtml(value[, options])`](#fromhtmlvalue-options)
  * [`ErrorCode`](#errorcode)
  * [`ErrorSeverity`](#errorseverity)
  * [`OnError`](#onerror)
  * [`Options`](#options)
* [Examples](#examples)
  * [Example: fragment versus document](#example-fragment-versus-document)
  * [Example: whitespace around and inside `<html>`](#example-whitespace-around-and-inside-html)
  * [Example: parse errors](#example-parse-errors)
* [Syntax](#syntax)
* [Compatibility](#compatibility)
* [Security](#security)
* [Related](#related)
* [Contribute](#contribute)
* [License](#license)

## What is this?

This package is a utility that takes HTML input and turns it into a hast syntax
tree.

## When should I use this?

If you want to handle syntax trees manually, use this.

Use [`parse5`][github-parse5] instead when you just want to parse HTML and
don’t care about [hast][github-hast].
You can also use
[`hast-util-from-parse5`][github-hast-util-from-parse5] and
[`parse5`][github-parse5] yourself,
or use the rehype plugin [`rehype-parse`][github-rehype-parse],
which wraps this utility to also parse HTML at a higher-level (easier)
abstraction.
[`xast-util-from-xml`][github-xast-util-from-xml] can be used if you are
dealing with XML instead of HTML.

If you might run in a browser and prefer a lighter alternative,
while not caring about positional info, parse errors, and consistency across
browsers,
use
[`hast-util-from-html-isomorphic`][github-hast-util-from-html-isomorphic],
which wraps this in Node and uses browser APIs otherwise.

Finally you can use the utility
[`hast-util-to-html`][github-hast-util-to-html] for the inverse of this
utility.
It turns hast into HTML.

## Install

This package is [ESM only][github-gist-esm].
In Node.js (version 16+), install with [npm][npmjs-install]:

```sh
npm install hast-util-from-html
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {fromHtml} from 'https://esm.sh/hast-util-from-html@2?bundle'
</script>
```

## Use

```js
import {fromHtml} from 'hast-util-from-html'

const tree = fromHtml('<h1>Hello, world!</h1>', {fragment: true})

console.log(tree)
```

Yields:

```js
{
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'h1',
      properties: {},
      children: [Array],
      position: [Object]
    }
  ],
  data: { quirksMode: false },
  position: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 23, offset: 22 }
  }
}
```

## API

This package exports the identifier [`fromHtml`][api-from-html].
There is no default export.
It exports the additional [TypeScript][] types
[`ErrorCode`][api-error-code],
[`ErrorSeverity`][api-error-severity],
[`OnError`][api-on-error],
and
[`Options`][api-options].

### `fromHtml(value[, options])`

Turn serialized HTML into a hast tree.

###### Parameters

* `value` ([`Compatible`][github-vfile-compatible])
  — serialized HTML to parse
* `options` ([`Options`][api-options], optional)
  — configuration

###### Returns

Tree ([`Root`][github-hast-root]).

### `ErrorCode`

Known names of parse errors (TypeScript type).

###### Types

```ts
type ErrorCode =
  | 'abandonedHeadElementChild'
  | 'abruptClosingOfEmptyComment'
  | 'abruptDoctypePublicIdentifier'
  // … see readme on `options[key in ErrorCode]` below.
```

### `ErrorSeverity`

Error severity (TypeScript type).

###### Types

```ts
export type ErrorSeverity =
  // Turn the parse error off:
  | 0
  | false
  // Turn the parse error into a warning:
  | 1
  | true
  // Turn the parse error into an actual error: processing stops.
  | 2
```

### `OnError`

Function called when encountering [HTML parse errors][whatwg-parse-errors].

###### Parameters

* `error` ([`VFileMessage`][github-vfile-message])
  — message

###### Returns

Nothing (`void`).

### `Options`

Configuration (TypeScript type).

##### Fields

###### `options.space`

Which space the document is in (`'html'` or `'svg'`, default: `'html'`).

When an `<svg>` element is found in the HTML space, `hast-util-from-html`
already automatically switches to and from the SVG space when entering and
exiting it.

> 👉 **Note**: this is not an XML parser.
> It supports SVG as embedded in HTML.
> It does not support the features available in XML.
> Passing SVG files might break but fragments of modern SVG should be fine.
> Use [`xast-util-from-xml`][github-xast-util-from-xml] to parse XML.

> 👉 **Note**: make sure to set `fragment: true` if `space: 'svg'`.

###### `options.verbose`

Add extra positional info about attributes, start tags, and end tags
(`boolean`, default: `false`).

###### `options.fragment`

Whether to parse as a fragment (`boolean`, default: `false`).
The default is to expect a whole document.
In document mode, unopened `html`, `head`, and `body` elements are opened.

###### `options.onerror`

Function called when encountering [HTML parse errors][whatwg-parse-errors]
([`OnError`][api-on-error], optional).

###### `options[key in ErrorCode]`

Specific parse errors can be configured by setting their identifiers (see
[`ErrorCode`][api-error-code]) as keys directly in `options` to an
[`ErrorSeverity`][api-error-severity] as value.

The list of parse errors:

<!-- parse-error start -->

* `abandonedHeadElementChild` — unexpected metadata element after head ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/abandoned-head-element-child/index.html))
* [`abruptClosingOfEmptyComment`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-abrupt-closing-of-empty-comment) — unexpected abruptly closed empty comment ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/abrupt-closing-of-empty-comment/index.html))
* [`abruptDoctypePublicIdentifier`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-abrupt-doctype-public-identifier) — unexpected abruptly closed public identifier ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/abrupt-doctype-public-identifier/index.html))
* [`abruptDoctypeSystemIdentifier`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-abrupt-doctype-system-identifier) — unexpected abruptly closed system identifier ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/abrupt-doctype-system-identifier/index.html))
* [`absenceOfDigitsInNumericCharacterReference`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-absence-of-digits-in-numeric-character-reference) — unexpected non-digit at start of numeric character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/absence-of-digits-in-numeric-character-reference/index.html))
* [`cdataInHtmlContent`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-cdata-in-html-content) — unexpected CDATA section in HTML ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/cdata-in-html-content/index.html))
* [`characterReferenceOutsideUnicodeRange`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-character-reference-outside-unicode-range) — unexpected too big numeric character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/character-reference-outside-unicode-range/index.html))
* `closingOfElementWithOpenChildElements` — unexpected closing tag with open child elements ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/closing-of-element-with-open-child-elements/index.html))
* [`controlCharacterInInputStream`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-control-character-in-input-stream) — unexpected control character ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/control-character-in-input-stream/index.html))
* [`controlCharacterReference`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-control-character-reference) — unexpected control character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/control-character-reference/index.html))
* `disallowedContentInNoscriptInHead` — disallowed content inside `<noscript>` in `<head>` ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/disallowed-content-in-noscript-in-head/index.html))
* [`duplicateAttribute`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-duplicate-attribute) — unexpected duplicate attribute ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/duplicate-attribute/index.html))
* [`endTagWithAttributes`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-end-tag-with-attributes) — unexpected attribute on closing tag ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/end-tag-with-attributes/index.html))
* [`endTagWithTrailingSolidus`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-end-tag-with-trailing-solidus) — unexpected slash at end of closing tag ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/end-tag-with-trailing-solidus/index.html))
* `endTagWithoutMatchingOpenElement` — unexpected unopened end tag ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/end-tag-without-matching-open-element/index.html))
* [`eofBeforeTagName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-eof-before-tag-name) — unexpected end of file ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/eof-before-tag-name/index.html))
* [`eofInCdata`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-eof-in-cdata) — unexpected end of file in CDATA ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/eof-in-cdata/index.html))
* [`eofInComment`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-eof-in-comment) — unexpected end of file in comment ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/eof-in-comment/index.html))
* [`eofInDoctype`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-eof-in-doctype) — unexpected end of file in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/eof-in-doctype/index.html))
* `eofInElementThatCanContainOnlyText` — unexpected end of file in element that can only contain text ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/eof-in-element-that-can-contain-only-text/index.html))
* [`eofInScriptHtmlCommentLikeText`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-eof-in-script-html-comment-like-text) — unexpected end of file in comment inside script ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/eof-in-script-html-comment-like-text/index.html))
* [`eofInTag`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-eof-in-tag) — unexpected end of file in tag ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/eof-in-tag/index.html))
* [`incorrectlyClosedComment`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-incorrectly-closed-comment) — incorrectly closed comment ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/incorrectly-closed-comment/index.html))
* [`incorrectlyOpenedComment`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-incorrectly-opened-comment) — incorrectly opened comment ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/incorrectly-opened-comment/index.html))
* [`invalidCharacterSequenceAfterDoctypeName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-invalid-character-sequence-after-doctype-name) — invalid sequence after doctype name ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/invalid-character-sequence-after-doctype-name/index.html))
* [`invalidFirstCharacterOfTagName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-invalid-first-character-of-tag-name) — invalid first character in tag name ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/invalid-first-character-of-tag-name/index.html))
* `misplacedDoctype` — misplaced doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/misplaced-doctype/index.html))
* `misplacedStartTagForHeadElement` — misplaced `<head>` start tag ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/misplaced-start-tag-for-head-element/index.html))
* [`missingAttributeValue`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-attribute-value) — missing attribute value ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-attribute-value/index.html))
* `missingDoctype` — missing doctype before other content ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-doctype/index.html))
* [`missingDoctypeName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-doctype-name) — missing doctype name ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-doctype-name/index.html))
* [`missingDoctypePublicIdentifier`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-doctype-public-identifier) — missing public identifier in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-doctype-public-identifier/index.html))
* [`missingDoctypeSystemIdentifier`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-doctype-system-identifier) — missing system identifier in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-doctype-system-identifier/index.html))
* [`missingEndTagName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-end-tag-name) — missing name in end tag ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-end-tag-name/index.html))
* [`missingQuoteBeforeDoctypePublicIdentifier`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-quote-before-doctype-public-identifier) — missing quote before public identifier in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-quote-before-doctype-public-identifier/index.html))
* [`missingQuoteBeforeDoctypeSystemIdentifier`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-quote-before-doctype-system-identifier) — missing quote before system identifier in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-quote-before-doctype-system-identifier/index.html))
* [`missingSemicolonAfterCharacterReference`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-semicolon-after-character-reference) — missing semicolon after character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-semicolon-after-character-reference/index.html))
* [`missingWhitespaceAfterDoctypePublicKeyword`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-whitespace-after-doctype-public-keyword) — missing whitespace after public identifier in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-whitespace-after-doctype-public-keyword/index.html))
* [`missingWhitespaceAfterDoctypeSystemKeyword`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-whitespace-after-doctype-system-keyword) — missing whitespace after system identifier in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-whitespace-after-doctype-system-keyword/index.html))
* [`missingWhitespaceBeforeDoctypeName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-whitespace-before-doctype-name) — missing whitespace before doctype name ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-whitespace-before-doctype-name/index.html))
* [`missingWhitespaceBetweenAttributes`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-whitespace-between-attributes) — missing whitespace between attributes ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-whitespace-between-attributes/index.html))
* [`missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-whitespace-between-doctype-public-and-system-identifiers) — missing whitespace between public and system identifiers in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/missing-whitespace-between-doctype-public-and-system-identifiers/index.html))
* [`nestedComment`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-nested-comment) — unexpected nested comment ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/nested-comment/index.html))
* `nestedNoscriptInHead` — unexpected nested `<noscript>` in `<head>` ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/nested-noscript-in-head/index.html))
* `nonConformingDoctype` — unexpected non-conforming doctype declaration ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/non-conforming-doctype/index.html))
* [`nonVoidHtmlElementStartTagWithTrailingSolidus`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-non-void-html-element-start-tag-with-trailing-solidus) — unexpected trailing slash on start tag of non-void element ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/non-void-html-element-start-tag-with-trailing-solidus/index.html))
* [`noncharacterCharacterReference`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-noncharacter-character-reference) — unexpected noncharacter code point referenced by character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/noncharacter-character-reference/index.html))
* [`noncharacterInInputStream`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-noncharacter-in-input-stream) — unexpected noncharacter character ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/noncharacter-in-input-stream/index.html))
* [`nullCharacterReference`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-null-character-reference) — unexpected NULL character referenced by character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/null-character-reference/index.html))
* `openElementsLeftAfterEof` — unexpected end of file ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/open-elements-left-after-eof/index.html))
* [`surrogateCharacterReference`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-surrogate-character-reference) — unexpected surrogate character referenced by character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/surrogate-character-reference/index.html))
* [`surrogateInInputStream`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-surrogate-in-input-stream) — unexpected surrogate character
* [`unexpectedCharacterAfterDoctypeSystemIdentifier`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-character-after-doctype-system-identifier) — invalid character after system identifier in doctype ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unexpected-character-after-doctype-system-identifier/index.html))
* [`unexpectedCharacterInAttributeName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-character-in-attribute-name) — unexpected character in attribute name ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unexpected-character-in-attribute-name/index.html))
* [`unexpectedCharacterInUnquotedAttributeValue`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-character-in-unquoted-attribute-value) — unexpected character in unquoted attribute value ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unexpected-character-in-unquoted-attribute-value/index.html))
* [`unexpectedEqualsSignBeforeAttributeName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-equals-sign-before-attribute-name) — unexpected equals sign before attribute name ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unexpected-equals-sign-before-attribute-name/index.html))
* [`unexpectedNullCharacter`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-null-character) — unexpected NULL character ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unexpected-null-character/index.html))
* [`unexpectedQuestionMarkInsteadOfTagName`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-question-mark-instead-of-tag-name) — unexpected question mark instead of tag name ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unexpected-question-mark-instead-of-tag-name/index.html))
* [`unexpectedSolidusInTag`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unexpected-solidus-in-tag) — unexpected slash in tag ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unexpected-solidus-in-tag/index.html))
* [`unknownNamedCharacterReference`](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-unknown-named-character-reference) — unexpected unknown named character reference ([example](https://github.com/syntax-tree/hast-util-from-html/blob/main/test/parse-error/unknown-named-character-reference/index.html))

<!-- parse-error end -->

## Examples

### Example: fragment versus document

The following example shows the difference between parsing as a document and
parsing as a fragment:

```js
import {fromHtml} from 'hast-util-from-html'

const doc = '<title>Hi!</title><h1>Hello!</h1>'

console.log(fromHtml(doc))

console.log(fromHtml(doc, {fragment: true}))
```

…yields (positional info and data omitted for brevity):

```js
{
  type: 'root',
  children: [
    {type: 'element', tagName: 'html', properties: {}, children: [Array]}
  ]
}
```

```js
{
  type: 'root',
  children: [
    {type: 'element', tagName: 'title', properties: {}, children: [Array]},
    {type: 'element', tagName: 'h1', properties: {}, children: [Array]}
  ]
}
```

> 👉 **Note**: observe that when a whole document is expected (first example),
> missing elements are opened and closed.

### Example: whitespace around and inside `<html>`

The following example shows how whitespace is handled when around and directly
inside the `<html>` element:

```js
import {fromHtml} from 'hast-util-from-html'
import {inspect} from 'unist-util-inspect'

const doc = `<!doctype html>
<html lang=en>
  <head>
    <title>Hi!</title>
  </head>
  <body>
    <h1>Hello!</h1>
  </body>
</html>`

console.log(inspect(fromHtml(doc)))
```

…yields:

```text
root[2] (1:1-9:8, 0-119)
│ data: {"quirksMode":false}
├─0 doctype (1:1-1:16, 0-15)
└─1 element<html>[3] (2:1-9:8, 16-119)
    │ properties: {"lang":"en"}
    ├─0 element<head>[3] (3:3-5:10, 33-72)
    │   │ properties: {}
    │   ├─0 text "\n    " (3:9-4:5, 39-44)
    │   ├─1 element<title>[1] (4:5-4:23, 44-62)
    │   │   │ properties: {}
    │   │   └─0 text "Hi!" (4:12-4:15, 51-54)
    │   └─2 text "\n  " (4:23-5:3, 62-65)
    ├─1 text "\n  " (5:10-6:3, 72-75)
    └─2 element<body>[3] (6:3-8:10, 75-111)
        │ properties: {}
        ├─0 text "\n    " (6:9-7:5, 81-86)
        ├─1 element<h1>[1] (7:5-7:20, 86-101)
        │   │ properties: {}
        │   └─0 text "Hello!" (7:9-7:15, 90-96)
        └─2 text "\n  \n" (7:20-9:1, 101-112)
```

> 👉 **Note**: observe that the line ending before `<html>` is ignored, the line
> ending and two spaces before `<head>` is moved inside it, and the line ending
> after `</body>` is moved before it.

This behavior is described by the HTML standard (see the section 13.2.6.4.1
“The ‘initial’ insertion mode” and adjacent states) which we follow.

The changes to this meaningless whitespace should not matter,
except when formatting markup,
in which case [`rehype-format`][github-rehype-format] can be used to improve
the source code.

### Example: parse errors

The following example shows how HTML parse errors can be enabled and configured:

```js
import {fromHtml} from 'hast-util-from-html'

const doc = `<!doctypehtml>
<title class="a" class="b">Hello…</title>
<h1/>World!</h1>`

fromHtml(doc, {
  onerror: console.log,
  missingWhitespaceBeforeDoctypeName: 2, // Mark one as a fatal error.
  nonVoidHtmlElementStartTagWithTrailingSolidus: false // Ignore one.
})
```

…yields:

```text
[1:10-1:10: Missing whitespace before doctype name] {
  ancestors: undefined,
  cause: undefined,
  column: 10,
  fatal: true,
  file: '',
  line: 1,
  place: {
    start: { line: 1, column: 10, offset: 9 },
    end: { line: 1, column: 10, offset: 9 }
  },
  reason: 'Missing whitespace before doctype name',
  ruleId: 'missing-whitespace-before-doctype-name',
  source: 'hast-util-from-html',
  actual: undefined,
  expected: undefined,
  note: 'Unexpected `h`. Expected ASCII whitespace instead',
  url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-missing-whitespace-before-doctype-name'
}
[2:23-2:23: Unexpected duplicate attribute] {
  ancestors: undefined,
  cause: undefined,
  column: 23,
  fatal: false,
  file: '',
  line: 2,
  place: {
    start: { line: 2, column: 23, offset: 37 },
    end: { line: 2, column: 23, offset: 37 }
  },
  reason: 'Unexpected duplicate attribute',
  ruleId: 'duplicate-attribute',
  source: 'hast-util-from-html',
  actual: undefined,
  expected: undefined,
  note: 'Unexpectedly double attribute. Expected attributes to occur only once',
  url: 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-duplicate-attribute'
}
```

> 🧑‍🏫 **Info**: messages in unified are warnings instead of errors.
> Other linters (such as ESLint) almost always use errors.
> Why?
> Those tools *only* check code style.
> They don’t generate, transform, and format code, which is what we focus on,
> too.
> Errors in unified mean the same as an exception in your JavaScript code: a
> crash.
> That’s why we use warnings instead, because we can continue doing work.

## Syntax

HTML is parsed according to WHATWG HTML (the living standard), which is also
followed by browsers such as Chrome and Firefox.

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `hast-util-from-html@^2`,
compatible with Node.js 16.

## Security

Parsing HTML is safe but using user-provided content can open you up to a
[cross-site scripting (XSS)][wikipedia-xss] attack.
Use [`hast-util-sanitize`][github-hast-util-sanitize] to make the hast tree
safe.

## Related

* [`hast-util-to-html`][github-hast-util-to-html]
  — serialize hast
* [`hast-util-sanitize`][github-hast-util-sanitize]
  — sanitize hast
* [`xast-util-from-xml`][github-xast-util-from-xml]
  — parse XML

## Contribute

See [`contributing.md`][health-contributing] in [`syntax-tree/.github`][health]
for ways to get started.
See [`support.md`][health-support] for ways to get help.

This project has a [code of conduct][health-coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][file-license] © [Titus Wormer][wooorm]

<!-- Definitions -->

[api-error-code]: #errorcode

[api-error-severity]: #errorseverity

[api-from-html]: #fromhtmlvalue-options

[api-on-error]: #onerror

[api-options]: #options

[badge-build-image]: https://github.com/syntax-tree/hast-util-from-html/workflows/main/badge.svg

[badge-build-url]: https://github.com/syntax-tree/hast-util-from-html/actions

[badge-coverage-image]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-from-html.svg

[badge-coverage-url]: https://codecov.io/github/syntax-tree/hast-util-from-html

[badge-downloads-image]: https://img.shields.io/npm/dm/hast-util-from-html.svg

[badge-downloads-url]: https://www.npmjs.com/package/hast-util-from-html

[badge-size-image]: https://img.shields.io/bundlejs/size/hast-util-from-html

[badge-size-url]: https://bundlejs.com/?q=hast-util-from-html

[esmsh]: https://esm.sh

[file-license]: license

[github-gist-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[github-hast]: https://github.com/syntax-tree/hast

[github-hast-root]: https://github.com/syntax-tree/hast#root

[github-hast-util-from-html-isomorphic]: https://github.com/syntax-tree/hast-util-from-html-isomorphic

[github-hast-util-from-parse5]: https://github.com/syntax-tree/hast-util-from-parse5

[github-hast-util-sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[github-hast-util-to-html]: https://github.com/syntax-tree/hast-util-to-html

[github-parse5]: https://github.com/inikulin/parse5

[github-rehype-format]: https://github.com/rehypejs/rehype-format

[github-rehype-parse]: https://github.com/rehypejs/rehype/tree/main/packages/rehype-parse#readme

[github-vfile-compatible]: https://github.com/vfile/vfile#compatible

[github-vfile-message]: https://github.com/vfile/vfile-message#vfilemessagereason-place-origin

[github-xast-util-from-xml]: https://github.com/syntax-tree/xast-util-from-xml

[health]: https://github.com/syntax-tree/.github

[health-coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[health-contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[health-support]: https://github.com/syntax-tree/.github/blob/main/support.md

[npmjs-install]: https://docs.npmjs.com/cli/install

[typescript]: https://www.typescriptlang.org

[whatwg-parse-errors]: https://html.spec.whatwg.org/multipage/parsing.html#parse-errors

[wikipedia-xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[wooorm]: https://wooorm.com

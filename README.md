# Advanced Search Query

> Another simple parser for advanced search query syntax.
> This version is a fork of https://github.com/mixmaxhq/search-string but it is actively maintained and uses TypeScript.

[![npm version](https://badge.fury.io/js/%40approvals-cloud%2Fadvanced-search-query.svg)](https://badge.fury.io/js/%40approvals-cloud%2Fadvanced-search-query)

It parses typical Gmail-style search strings like:

```
to:me -from:joe@mixmax.com foobar1 -foobar2
```

And returns an instance which can be mutated, return different data structures, or return the gmail-style search string again.

## Installation

```shell
$ yarn add @approvals-cloud/advanced-search-query
```

## Usage

```javascript
const AdvancedSearchQuery = require('@approvals-cloud/advanced-search-query')

// Perform parsing
const str = 'to:me -from:joe@mixmax.com foobar1 -foobar2'
const parsedSearchQuery = AdvancedSearchQuery.parse(str)

/* Get text in different formats. */

// [ { text: 'foorbar1', negated: false }, { text: 'foobar2', negated: true } ]
parsedSearchQuery.getTextSegments()

// `foobar1 -foobar2`
parsedSearchQuery.getAllText()

/* Get conditions in different formats. */

// Standard format: Condition Array
// [ { keyword: 'to', value: 'me', negated: false }, { keyword: 'from', value: 'joe@mixmax.com', negated: true } ]
parsedSearchQuery.getConditionArray()

// Alternate format: Parsed Query
// { to: ['me'], excludes: { from: ['joe@mixmax.com'] }}
parsedSearchQuery.getParsedQuery()

/* Or get text and conditions back in string format. */

// `to:me -from:joe@mixmax.com foobar1 -foobar2`
parsedSearchQuery.toString()

/* Mutations exist as well for modifying an existing AdvancedSearchQuery structure. */

// `to:me foobar -foobar2`
parsedSearchQuery.removeKeyword('from', true).toString()

// `to:me from:jane@mixmax.com foobar1 -foobar2`
parsedSearchQuery.addEntry('from', 'jane@mixmax.com', false).toString()

// `from:jane@mixmax.com foobar1 -foobar2`
parsedSearchQuery.removeEntry('to', 'me', false).toString()

/* clone operation instantiates a new version by copying over data. */

// `from:jane@mixmax.com foobar1 -foobar2`
parsedSearchQuery.clone().toString()
```

## License

The MIT License (MIT)

Copyright 2019 Julian Hundeloh <julian@approvals.cloud>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

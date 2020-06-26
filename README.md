# Advanced Search Query

> Another simple parser for advanced search query syntax.

[![npm version](https://badge.fury.io/js/advanced-search-query.svg)](https://badge.fury.io/js/advanced-search-query)

It parses typical Gmail-style search strings like:

```
to:me -from:joe@mixmax.com foobar1 -foobar2
```

And returns an instance which can be mutated, return different data structures, or return the gmail-style search string again.

## Installation

```shell
$ yarn add advanced-search-query
```

## Usage

```javascript
import parseAdvancedSearchQuery from 'advanced-search-query'

// Perform parsing
const input = 'to:me -from:joe@mixmax.com foobar1 -foobar2'
const parsedSearchQuery = parseAdvancedSearchQuery(input)

// [ { text: 'foorbar1', isNegated: false }, { text: 'foobar2', isNegated: true } ]
parsedSearchQuery.getTexts()

// `foobar1 -foobar2`
parsedSearchQuery.getText()

// [ { keyword: 'to', value: 'me', isNegated: false }, { keyword: 'from', value: 'joe@mixmax.com', isNegated: true } ]
parsedSearchQuery.getKeywords()

// { to: { include: ['me'] }, from: { exclude: ['joe@mixmax.com'] }}
parsedSearchQuery.toObject()

// `to:me -from:joe@mixmax.com foobar1 -foobar2`
parsedSearchQuery.toString()

// `to:me foobar -foobar2`
parsedSearchQuery.removeKeyword('from', true).toString()

// `to:me from:jane@mixmax.com foobar1 -foobar2`
parsedSearchQuery.addKeyword('from', 'jane@mixmax.com', false).toString()

// `from:jane@mixmax.com foobar1 -foobar2`
parsedSearchQuery.removeKeyword('to', 'me', false).toString()

// `from:jane@mixmax.com -foobar2`
parsedSearchQuery.removeText('foobar1').toString()

// `from:jane@mixmax.com foobar1 -foobar2`
parsedSearchQuery.addText('foobar1', false).toString()

// `from:jane@mixmax.com foobar1 -foobar2`
parsedSearchQuery.clone().toString()
```

## License

The MIT License (MIT)

Copyright 2019 Julian Hundeloh <julian@approvals.cloud>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import parseAdvancedSearchQuery, { AdvancedSearchQuery } from '../src/index'

describe('searchString', () => {
    test('empty', () => {
        expect(parseAdvancedSearchQuery().getKeywords()).toEqual([])
        expect(parseAdvancedSearchQuery('').getKeywords()).toEqual([])
        expect(parseAdvancedSearchQuery('   ').getKeywords()).toEqual([])
        expect(parseAdvancedSearchQuery('').getKeywords()).toEqual([])
        expect(parseAdvancedSearchQuery('').toObject()).toEqual({})
    })

    test('bad input', () => {
        expect(parseAdvancedSearchQuery('to:').getKeywords()).toEqual([
            { name: 'to', value: '', isNegated: false },
        ])
        expect(
            parseAdvancedSearchQuery('quoted text"').getTexts()[0]
        ).toEqual({
            text: 'quoted',
            isNegated: false,
        })
        expect(
            parseAdvancedSearchQuery('quoted text"').getTexts()[1]
        ).toEqual({
            text: 'text"',
            isNegated: false,
        })
    })

    test('basic', () => {
        const input = 'to:me -from:joe@acme.com foobar'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: 'foobar', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(2)
        expect(parsed.getKeyword('to')).toEqual([
            {
                value: 'me',
                isNegated: false,
            },
        ])
        expect(parsed.getKeyword('from')).toEqual([
            {
                value: 'joe@acme.com',
                isNegated: true,
            },
        ])
    })

    test('multiple getText() segments', () => {
        const input = 'to:me foobar zoobar'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: 'foobar', isNegated: false },
            { text: 'zoobar', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.getKeyword('to')).toEqual([
            {
                value: 'me',
                isNegated: false,
            },
        ])
    })

    test('quoted value with space', () => {
        const input = 'to:"Marcus Ericsson" foobar'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: 'foobar', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.getKeyword('to')).toEqual([
            {
                value: 'Marcus Ericsson',
                isNegated: false,
            },
        ])
    })

    test('date example', () => {
        const input =
            'from:hi@mericsson.com,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos'
        const parsed = parseAdvancedSearchQuery(input)

        console.log(parsed.getKeywords())
        expect(parsed.getKeywords().length).toEqual(4)
        expect(parsed.getKeyword('from')).toEqual([
            { value: 'hi@mericsson.com', isNegated: false },
            { value: 'foo@gmail.com', isNegated: false },
        ])
        expect(parsed.getKeyword('date')).toEqual([
            {
                value: '1/10/2013-15/04/2014',
                isNegated: false,
            },
        ])
    })

    test('isNegated getText()', () => {
        const input = 'hello -big -fat is:condition world'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            {
                text: 'hello',
                isNegated: false,
            },
            { text: 'big', isNegated: true },
            { text: 'fat', isNegated: true },
            { text: 'world', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
    })

    test('complex use case', () => {
        const input =
            'op1:value op1:value2 op2:"multi, \'word\', value" sometext -op3:value more text'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: 'sometext', isNegated: false },
            { text: 'more', isNegated: false },
            { text: 'text', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(3)
        expect(parsed.getKeyword('op1')).toEqual([
            {
                value: 'value',
                isNegated: false,
            },
            {
                value: 'value2',
                isNegated: false,
            },
        ])
        expect(parsed.getKeyword('op2')).toEqual([
            {
                value: "multi, 'word', value",
                isNegated: false,
            },
        ])
        expect(parsed.getKeyword('op3')).toEqual([
            {
                value: 'value',
                isNegated: true,
            },
        ])
        expect(parsed.getKeywords().length).toEqual(4)
        expect(parsed.getKeywords()).toEqual([
            { name: 'op1', value: 'value', isNegated: false },
            { name: 'op1', value: 'value2', isNegated: false },
            { name: 'op2', value: "multi, 'word', value", isNegated: false },
            { name: 'op3', value: 'value', isNegated: true },
        ])
        expect(parsed.toString()).toEqual(
            'op1:value,value2 op2:"multi, \'word\', value" -op3:value sometext more text'
        )
        parsed.removeKeyword('op1')
        expect(parsed.toString()).toEqual(
            'op2:"multi, \'word\', value" -op3:value sometext more text'
        )
        // Check once more to see if cached copy returns correctly.
        expect(parsed.toString()).toEqual(
            'op2:"multi, \'word\', value" -op3:value sometext more text'
        )
        parsed.removeKeyword('op3')
        expect(parsed.toString()).toEqual(
            'op2:"multi, \'word\', value" -op3:value sometext more text'
        )
        parsed.removeKeyword('op3')
        expect(parsed.toString()).toEqual(
            'op2:"multi, \'word\', value" sometext more text'
        )
    })

    test('several quoted strings', () => {
        const input = '"string one" "string two"'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            {
                text: 'string one',
                isNegated: false,
            },
            { text: 'string two', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(0)
    })

    test('dash in text', () => {
        const input = 'my-string op1:val'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()[0]).toEqual({
            text: 'my-string',
            isNegated: false,
        })
        expect(parsed.getKeyword('op1')).toEqual([
            {
                value: 'val',
                isNegated: false,
            },
        ])
    })

    test('quoted semicolon string', () => {
        const input = 'op1:value "semi:string"'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: 'semi:string', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.getKeyword('op1')).toEqual([
            {
                value: 'value',
                isNegated: false,
            },
        ])
    })

    test('comma in condition value', () => {
        const input =
            'from:hello@mixmax.com template:"recruiting: reject email, inexperience"'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([])
        expect(parsed.getKeywords().length).toEqual(2)
        expect(parsed.getKeyword('template')).toEqual([
            {
                value: 'recruiting: reject email, inexperience',
                isNegated: false,
            },
        ])
    })

    test('intentional quote in text', () => {
        const input = "foo'bar from:aes"
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: "foo'bar", isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.getKeyword('from')).toEqual([
            {
                value: 'aes',
                isNegated: false,
            },
        ])
    })

    test('intentional quote in operand', () => {
        const input = "foobar from:ae's"
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: 'foobar', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.getKeyword('from')).toEqual([
            {
                value: "ae's",
                isNegated: false,
            },
        ])
        expect(parsed.toString()).toEqual("from:ae's foobar")
    })

    test('quote in condition value', () => {
        const input = 'foobar template:" hello \'there\': other"'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.getTexts()).toEqual([
            { text: 'foobar', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.getKeyword('template')).toEqual([
            {
                value: " hello 'there': other",
                isNegated: false,
            },
        ])
        expect(parsed.toString()).toEqual(
            'template:" hello \'there\': other" foobar'
        )
    })

    test('double quote in double quote condition value', () => {
        const input = 'foobar template:" hello \\"there\\": other"'
        const parsed = parseAdvancedSearchQuery(input)
        expect(parsed.getTexts()).toEqual([
            { text: 'foobar', isNegated: false },
        ])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.getKeyword('template')).toEqual([
            {
                value: ' hello "there": other',
                isNegated: false,
            },
        ])
        expect(parsed.toString()).toEqual(
            'template:" hello \\"there\\": other" foobar'
        )
    })

    test('two negative conditions concat toString', () => {
        const input = '-to:foo@foo.com,foo2@foo.com text'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.toObject().to.exclude).toEqual([
            'foo@foo.com',
            'foo2@foo.com',
        ])
        expect(parsed.toString()).toEqual('-to:foo@foo.com,foo2@foo.com text')
    })

    test('two negative conditions separate toString', () => {
        const input = '-to:foo@foo.com -to:foo2@foo.com text'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.toObject().to.exclude).toEqual([
            'foo@foo.com',
            'foo2@foo.com',
        ])
        expect(parsed.toString()).toEqual('-to:foo@foo.com,foo2@foo.com text')
    })

    test('transformTextToCondition', () => {
        const input = '<a@b.com> to:c@d.com'
        const parsed = parseAdvancedSearchQuery(input, [
            (text) => {
                return text === '<a@b.com>' ? { name: 'to', value: 'a@b.com', isNegated: true } : null
            }
        ])

        expect(parsed.getTexts()).toEqual([])
        expect(parsed.getKeywords().length).toEqual(1)
        expect(parsed.toObject().to.include).toEqual(['a@b.com', 'c@d.com'])
    })

    test('removeKeyword simple case', () => {
        const input = 'foo:bar,baz'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.toObject().foo).toEqual(['bar', 'baz'])

        parsed.removeKeyword('foo', 'baz', false)

        expect(parsed.toObject().foo.include).toEqual(['bar'])
    })

    test('removeKeyword should remove only one case', () => {
        const input = '-foo:bar,baz,bar,bar,bar'
        const parsed = parseAdvancedSearchQuery(input)

        expect(parsed.toObject().foo.exclude).toEqual([
            'bar',
            'baz',
            'bar',
            'bar',
            'bar',
        ])

        parsed.removeKeyword('foo', 'bar', true)

        expect(parsed.toObject().foo.exclude).toEqual([
            'baz',
            'bar',
            'bar',
            'bar',
        ])
    })

    test('removeKeyword should be noop if entry is not found', () => {
        const input = 'foo:bar'
        const parsed = parseAdvancedSearchQuery(input)
        expect(parsed.toObject().foo.include).toEqual(['bar'])
        expect(parsed.toString()).toEqual('foo:bar')
        expect(parsed.isDirty).toEqual(false)

        parsed.removeKeyword('foo', 'qux', false)

        expect(parsed.toObject().foo.include).toEqual(['bar'])
        expect(parsed.isDirty).toEqual(false)
    })
})

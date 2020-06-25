import groupBy from 'lodash.groupby'
import { getQuotePairMap } from './utils'

const RESET = 'RESET'
const IN_OPERAND = 'IN_OPERAND'
const IN_TEXT = 'IN_TEXT'
const SINGLE_QUOTE = 'SINGLE_QUOTE'
const DOUBLE_QUOTE = 'DOUBLE_QUOTE'

type State = typeof RESET | typeof IN_OPERAND | typeof IN_TEXT
type QuoteState = typeof RESET | typeof SINGLE_QUOTE | typeof DOUBLE_QUOTE
type Value = string
type Keyword = { name: string; value: Value; isNegated: boolean }
type Text = { value: string; isNegated: boolean }
type TransformTextToKeyword = (text: string) => Keyword | null
type ParsedQuery = {
  text: {
    include: Value[]
    exclude: Value[]
  }
  keywords: Record<
    string,
    {
      include: Value[]
      exclude: Value[]
    }
  >
}

export class AdvancedSearchQuery {
  keywords: Keyword[]
  texts: Text[]
  input: string
  output: string | undefined
  isDirty: boolean

  /**
   * Not intended for public use. API could change.
   */
  constructor(keywords: Keyword[], texts: Text[]) {
    this.keywords = keywords
    this.texts = texts
    this.input = ''
    this.isDirty = true
  }

  getText() {
    return this.texts
      ? this.texts
          .map(({ value, isNegated }) => (isNegated ? `-${value}` : value))
          .join(' ')
      : ''
  }

  getTexts() {
    return this.texts
  }

  getKeywords(): Record<string, Omit<Keyword, 'name'>[]> {
    const keywords = groupBy(this.keywords, 'name')

    return Object.entries(keywords)
      .map(([name, keywords]): [string, Omit<Keyword, 'name'>[]] => {
        return [
          name,
          keywords.map((keyword) => {
            return {
              ...keyword,
              name: undefined,
            }
          }),
        ]
      })
      .reduce((cumulatedKeywords, [name, keywords]) => {
        return {
          ...cumulatedKeywords,
          [name]: keywords,
        }
      }, {})
  }

  getKeyword(name: string): Omit<Keyword, 'name'>[] {
    return this.getKeywords()[name]
  }

  toObject() {
    const parsedQuery: ParsedQuery = {
      text: {
        include: this.getTexts()
          .filter((text) => {
            return text.isNegated === false
          })
          .map((text) => {
            return text.value
          }),
        exclude: this.getTexts()
          .filter((text) => {
            return text.isNegated === true
          })
          .map((text) => {
            return text.value
          }),
      },
      keywords: {},
    }

    this.keywords.forEach((keyword) => {
      parsedQuery.keywords[keyword.name] = parsedQuery.keywords[
        keyword.name
      ] || {
        include: [],
        exclude: [],
      }

      if (keyword.isNegated) {
        parsedQuery.keywords[keyword.name].exclude.push(keyword.value)
      } else {
        parsedQuery.keywords[keyword.name].include.push(keyword.value)
      }
    })

    return parsedQuery
  }

  addKeyword(name: string, value: Value, isNegated: boolean) {
    this.keywords.push({
      name,
      value,
      isNegated,
    })
    this.isDirty = true
  }

  removeKeyword(name: string, value?: Value, isNegated?: boolean) {
    const keywords = this.keywords.filter((keyword) => {
      if (name !== keyword.name) {
        return true
      }

      if (typeof value !== 'undefined' && value !== keyword.value) {
        return true
      }

      if (typeof isNegated !== 'undefined' && isNegated !== keyword.isNegated) {
        return true
      }

      return false
    })
    this.isDirty = keywords.length !== this.keywords.length
    this.keywords = keywords

    return this
  }

  clone() {
    return new AdvancedSearchQuery(this.keywords.slice(0), this.texts.slice(0))
  }

  toString() {
    if (!this.isDirty && this.output) {
      return this.output
    }

    // Group keyword, isNegated pairs as keys
    const conditionGroups: Record<string, string[]> = {}
    this.keywords.forEach(({ name, value, isNegated }) => {
      const isNegatedPrefix = isNegated ? '-' : ''
      const key = `${isNegatedPrefix}${name}`
      conditionGroups[key] = conditionGroups[key] || []

      conditionGroups[key].push(value)
    })

    // Build condition
    let condition = ''
    Object.keys(conditionGroups).forEach((conditionGroupKey) => {
      const values = conditionGroups[conditionGroupKey]
      const safeValues = values.filter(Boolean).map((value) => {
        let newV = ''
        let shouldQuote = false
        for (let i = 0; i < value.length; i++) {
          const char = value[i]
          if (char === '"') {
            newV += '\\"'
          } else {
            if (char === ' ' || char === ',') {
              shouldQuote = true
            }
            newV += char
          }
        }
        return shouldQuote ? `"${newV}"` : newV
      })

      if (safeValues.length > 0) {
        condition += ` ${conditionGroupKey}:${safeValues.join(',')}`
      }
    })

    this.output = `${condition} ${this.getText()}`.trim()
    this.isDirty = false

    return this.output
  }
}

/**
 * @param {String} string to parse e.g. 'to:me -from:joe@acme.com foobar'.
 * @param {Array} transformTextToConditions Array of functions to transform text into conditions
 * @returns {AdvancedSearchQuery} An instance of class AdvancedSearchQuery.
 */
export default function (
  input: string = '',
  transformTextToKeywords: TransformTextToKeyword[] = []
) {
  const keywords: Keyword[] = []
  const texts: Text[] = []

  const addCondition = (name: string, value: Value, isNegated: boolean) => {
    keywords.push({
      name,
      value,
      isNegated,
    })
  }

  const addTextSegment = (value: string, isNegated: boolean) => {
    let hasTransform = false
    transformTextToKeywords.forEach((transform) => {
      const transformed = transform(value)
      if (transformed) {
        const { name, value } = transformed
        if (name && value) {
          addCondition(name, value, isNegated)
          hasTransform = true
        }
      }
    })
    if (!hasTransform) {
      texts.push({ value, isNegated })
    }
  }

  let state: State = RESET
  let currentOperand = ''
  let isNegated = false
  let currentText = ''
  let quoteState: QuoteState
  let prevChar = ''

  const performReset = () => {
    state = RESET
    quoteState = RESET
    currentOperand = ''
    currentText = ''
    isNegated = false
    prevChar = ''
  }

  // Terminology, in this example: 'to:joe@acme.com'
  // 'to' is the operator
  // 'joe@acme.com' is the operand
  // 'to:joe@acme.com' is the condition

  // Possible states:
  const inText = () => state === IN_TEXT // could be inside raw text or operator
  const inOperand = () => state === IN_OPERAND
  const inSingleQuote = () => quoteState === SINGLE_QUOTE
  const inDoubleQuote = () => quoteState === DOUBLE_QUOTE
  const inQuote = () => inSingleQuote() || inDoubleQuote()

  performReset()

  const quotePairMap = getQuotePairMap(input)

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === ' ') {
      if (inOperand()) {
        if (inQuote()) {
          currentOperand += char
        } else {
          addCondition(currentText, currentOperand, isNegated)
          performReset()
        }
      } else if (inText()) {
        if (inQuote()) {
          currentText += char
        } else {
          addTextSegment(currentText, isNegated)
          performReset()
        }
      }
    } else if (char === ',' && inOperand() && !inQuote()) {
      addCondition(currentText, currentOperand, isNegated)
      // No reset here because we are still evaluating operands for the same operator
      currentOperand = ''
    } else if (char === '-' && !inOperand() && !inText()) {
      isNegated = true
    } else if (char === ':' && !inQuote()) {
      if (inOperand()) {
        // If we're in an operand, just push the string on.
        currentOperand += char
      } else if (inText()) {
        // Skip this char, move states into IN_OPERAND,
        state = IN_OPERAND
      }
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote()) {
      if (inDoubleQuote()) {
        quoteState = RESET
      } else if (quotePairMap.double[i]) {
        quoteState = DOUBLE_QUOTE
      } else if (inOperand()) {
        currentOperand += char
      } else {
        currentText += char
      }
    } else if (char === "'" && prevChar !== '\\' && !inDoubleQuote()) {
      if (inSingleQuote()) {
        quoteState = RESET
      } else if (quotePairMap.single[i]) {
        quoteState = SINGLE_QUOTE
      } else if (inOperand()) {
        currentOperand += char
      } else {
        currentText += char
      }
    } else if (char !== '\\') {
      // Regular character..
      if (inOperand()) {
        currentOperand += char
      } else {
        currentText += char
        state = IN_TEXT
      }
    }
    prevChar = char
  }
  // End of string, add any last entries
  if (inText()) {
    addTextSegment(currentText, isNegated)
  } else if (inOperand()) {
    addCondition(currentText, currentOperand, isNegated)
  }

  return new AdvancedSearchQuery(keywords, texts)
}

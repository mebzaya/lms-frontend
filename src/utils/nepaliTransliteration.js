// Phonetic Romanized-Nepali -> Devanagari (Unicode) transliteration, for
// people without a Nepali keyboard/IME. Follows the common case-sensitive
// romanized scheme: lowercase t/th/d/dh/n/sh are dental/palatal, uppercase
// T/Th/D/Dh/N/Sh are retroflex.
//
// Devanagari Unicode rules applied:
//  - A consonant carries an inherent "a"; a following vowel is written as a
//    dependent sign (matra) instead: क + ा = का.
//  - Two consonants with no vowel between them join via the virama/halant
//    (U+094D): स + ् + त = स्त.
//  - A vowel at the start of a word, or right after another vowel, uses its
//    independent letter form: आ, इ, उ...
//  - Anusvara ं, chandrabindu ँ and visarga ः attach after a vowel sound.
//
// Words are converted whole once a boundary (space/punctuation) is typed, or
// when the field is left (see finalizeNepaliWord), so a matra is never
// written before its consonant is known.

const CONSONANTS = [
  ['ksh', 'क्ष'],
  ['jny', 'ज्ञ'],
  ['chh', 'छ'],
  ['Th', 'ठ'],
  ['Dh', 'ढ'],
  ['Sh', 'ष'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ch', 'च'],
  ['jh', 'झ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['ng', 'ङ'],
  ['yn', 'ञ'],
  ['gy', 'ज्ञ'],
  ['x', 'क्ष'],
  ['k', 'क'],
  ['q', 'क'],
  ['g', 'ग'],
  ['c', 'च'],
  ['j', 'ज'],
  ['z', 'ज'],
  ['T', 'ट'],
  ['D', 'ड'],
  ['N', 'ण'],
  ['t', 'त'],
  ['d', 'द'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['S', 'ष'],
  ['s', 'स'],
  ['h', 'ह'],
].sort((a, b) => b[0].length - a[0].length)

// [romanized, independent form, dependent sign (matra)]
const VOWELS = [
  ['rri', 'ऋ', 'ृ'],
  ['aa', 'आ', 'ा'],
  ['ai', 'ऐ', 'ै'],
  ['au', 'औ', 'ौ'],
  ['ou', 'औ', 'ौ'],
  ['ee', 'ई', 'ी'],
  ['ii', 'ई', 'ी'],
  ['oo', 'ऊ', 'ू'],
  ['uu', 'ऊ', 'ू'],
  ['a', 'अ', ''],
  ['i', 'इ', 'ि'],
  ['u', 'उ', 'ु'],
  ['e', 'ए', 'े'],
  ['o', 'ओ', 'ो'],
].sort((a, b) => b[0].length - a[0].length)

const SIGNS = [
  ['M', 'ं'],
  ['~', 'ँ'],
  ['H', 'ः'],
  ['\\', '्'],
]

const HALANT = '्'
const DEVANAGARI_DIGITS = '०१२३४५६७८९'
const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u'])

function matchLongest(text, index, patterns) {
  for (const entry of patterns) {
    if (text.startsWith(entry[0], index)) return entry
  }
  return null
}

// Case only carries meaning for T, D, N, S (retroflex) and M, H (anusvara,
// visarga). Every other capital is lowercased, so sentence-initial
// capitalisation ("Mero", "Ram") doesn't change the letter. Some capitals can
// only be meant one way by where they sit:
//  - ण and ष essentially never begin a Nepali word, so a word-initial N/S is
//    just a capitalised न/स (and "Sh" there is श).
//  - ं and ः always follow a vowel sound, so M/H not after a vowel are m/h.
function normalizeCase(word) {
  let out = ''
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    const lower = ch.toLowerCase()

    if (ch === lower) {
      out += ch
    } else if (ch === 'T' || ch === 'D') {
      out += ch
    } else if (ch === 'N' || ch === 'S') {
      out += i === 0 ? lower : ch
    } else if (ch === 'M' || ch === 'H') {
      out += VOWEL_LETTERS.has(out[i - 1]) ? ch : lower
    } else {
      out += lower
    }
  }
  return out
}

function matchConsonant(word, index) {
  const consonant = matchLongest(word, index, CONSONANTS)
  // "gy" is ज्ञ at the start of a word (ज्ञान), but mid-word it's almost
  // always ग्य (भाग्य, योग्य) — use "jny" for a mid-word ज्ञ (विज्ञान).
  if (consonant && consonant[0] === 'gy' && index !== 0) return ['g', 'ग']
  return consonant
}

export function transliterateWord(rawWord) {
  const word = normalizeCase(rawWord)
  let result = ''
  let i = 0

  while (i < word.length) {
    // "rri" (ऋ) would otherwise be read as the consonant र.
    const consonant = word.startsWith('rri', i) ? null : matchConsonant(word, i)
    if (consonant) {
      i += consonant[0].length
      const vowel = matchLongest(word, i, VOWELS)
      if (vowel) {
        result += consonant[1] + vowel[2]
        i += vowel[0].length
      } else if (matchConsonant(word, i)) {
        result += consonant[1] + HALANT
      } else {
        result += consonant[1]
      }
      continue
    }

    const vowel = matchLongest(word, i, VOWELS)
    if (vowel) {
      result += vowel[1]
      i += vowel[0].length
      continue
    }

    const sign = matchLongest(word, i, SIGNS)
    if (sign) {
      result += sign[1]
      i += sign[0].length
      continue
    }

    const ch = word[i]
    result += ch >= '0' && ch <= '9' ? DEVANAGARI_DIGITS[Number(ch)] : ch
    i += 1
  }

  return result
}

const BOUNDARY_CHARS = new Set([
  ' ', '\n', '\t', '.', '।', ',', '!', '?', ';', ':', '|', '-', '/', '(', ')', '"',
])
const DEVANAGARI_PATTERN = /[ऀ-ॿ]/
const LETTER_PATTERN = /[A-Za-zऀ-ॿ]/

/**
 * Given the full new value of a text field right after a keystroke, converts
 * the just-completed Romanized word to Devanagari if the keystroke that was
 * just typed is a word boundary (space/punctuation). A full stop typed right
 * after a word becomes the Nepali purna viram (।); one between digits (a
 * decimal point) is left alone.
 */
export function applyNepaliBoundaryConversion(newValue) {
  if (!newValue) return newValue

  const lastChar = newValue[newValue.length - 1]
  if (!BOUNDARY_CHARS.has(lastChar)) return newValue

  const end = newValue.length - 1
  let start = end
  while (start > 0 && !BOUNDARY_CHARS.has(newValue[start - 1])) {
    start -= 1
  }

  const word = newValue.slice(start, end)
  const converted = word && !DEVANAGARI_PATTERN.test(word) ? transliterateWord(word) : word
  const boundary = lastChar === '.' && LETTER_PATTERN.test(word.slice(-1)) ? '।' : lastChar

  return newValue.slice(0, start) + converted + boundary
}

/**
 * Converts every still-romanized word in the text, including the last one,
 * which has no boundary after it yet. `applyNepaliBoundaryConversion` alone
 * never converts a single-word answer (the common case for a fill-in-blank
 * or short-answer box), because the student usually submits right after
 * typing it with no trailing space. Called on blur and again right before
 * building the submit payload.
 */
export function finalizeNepaliText(value) {
  if (!value) return value

  let out = ''
  let word = ''
  const flushWord = () => {
    out += word && !DEVANAGARI_PATTERN.test(word) ? transliterateWord(word) : word
  }

  for (const ch of value) {
    if (!BOUNDARY_CHARS.has(ch)) {
      word += ch
      continue
    }
    const endsWithLetter = LETTER_PATTERN.test(word.slice(-1))
    flushWord()
    out += ch === '.' && endsWithLetter ? '।' : ch
    word = ''
  }
  flushWord()

  return out
}

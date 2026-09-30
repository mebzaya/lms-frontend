const TOKEN_PATTERN = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g

function renderToken(token, key) {
  if (/^\*\*[^*]+\*\*$/.test(token) || /^__[^_]+__$/.test(token)) {
    return <strong key={key}>{token.slice(2, -2)}</strong>
  }
  if (/^\*[^*]+\*$/.test(token) || /^_[^_]+_$/.test(token)) {
    return <em key={key}>{token.slice(1, -1)}</em>
  }
  return token
}

// Renders a small subset of markdown — bold (double asterisk or double
// underscore) and italic (single asterisk or single underscore) — as real
// React elements instead of showing the literal punctuation characters.
export default function MarkdownText({ text, as: Tag = 'span', className }) {
  if (!text) return null

  const parts = text.split(TOKEN_PATTERN).map((part, index) => renderToken(part, index))

  return <Tag className={className}>{parts}</Tag>
}

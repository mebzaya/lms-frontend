function compareValues(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'string' && typeof b === 'string') {
    // numeric: true makes embedded numbers compare by value, not digit by
    // digit — so "Class 9" sorts before "Class 10" instead of after it (as
    // plain lexicographic comparison would, since '1' < '9' as characters).
    return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
  }
  return a < b ? -1 : a > b ? 1 : 0
}

export function sortRows(rows, getValue, direction) {
  const sorted = [...rows].sort((a, b) => compareValues(getValue(a), getValue(b)))
  return direction === 'desc' ? sorted.reverse() : sorted
}

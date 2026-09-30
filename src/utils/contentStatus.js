export function contentStatus(lesson) {
  if (lesson.content_released_at) return 'released'
  if (lesson.has_content) return 'draft'
  return 'empty'
}

export const CONTENT_STATUS_LABEL = {
  released: 'Content released',
  draft: 'Content draft',
  empty: 'No content yet',
}

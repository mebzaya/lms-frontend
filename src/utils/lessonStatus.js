export function lessonStatus(lesson) {
  if (lesson.is_active) return 'live'
  if (lesson.ended_at) return 'ended'
  return 'not_started'
}

export const LESSON_STATUS_LABEL = {
  live: 'Live now',
  ended: 'Ended',
  not_started: 'Not started',
}

export function examStatus(exam) {
  if (!exam.published_at) return 'draft'

  const now = new Date()
  if (exam.starts_at && now < new Date(exam.starts_at)) return 'scheduled'
  if (exam.ends_at && now > new Date(exam.ends_at)) return 'ended'

  return 'live'
}

export const EXAM_STATUS_LABEL = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  live: 'Live now',
  ended: 'Ended',
}

// A simpler 4-state view for the admin exam list: draft/scheduled collapse
// into one "not started yet" state, and whether results have been published
// takes over once the exam has ended — this is what decides where the
// status pill links to (subject-wise view vs. the class-wide results page).
export function adminExamStatus(exam) {
  if (exam.results_published_at) return 'result_published'

  const status = examStatus(exam)
  if (status === 'live') return 'in_progress'
  if (status === 'ended') return 'result_pending'
  return 'scheduled'
}

export const ADMIN_EXAM_STATUS_LABEL = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  result_pending: 'Result Pending',
  result_published: 'Result Published',
}

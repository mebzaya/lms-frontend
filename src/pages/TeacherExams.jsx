import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTeacherDashboard } from '../api/teacher'
import { fetchTeacherSubjectExams } from '../api/subjectExams'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { EXAM_STATUS_LABEL, examStatus } from '../utils/examStatus'
import '../styles/common.css'
import './StudentDashboard.css'
import './TeacherSubjectExam.css'

// Every subject's paper is part of the same class-wide Exam (e.g.
// "First-Term"), so exams are grouped by that shared exam — not by subject —
// with each subject's paper listed underneath it. A teacher who teaches the
// same subject in two different classes sees two separate groups, since
// each class has its own exam.
function groupByExam(subjects, examsBySubject) {
  const groups = new Map()

  subjects.forEach((subject) => {
    ;(examsBySubject[subject.id] ?? []).forEach((exam) => {
      if (!groups.has(exam.exam_id)) {
        groups.set(exam.exam_id, { title: exam.title, className: subject.class?.name, rows: [] })
      }
      groups.get(exam.exam_id).rows.push({ subject, exam })
    })
  })

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      rows: [...group.rows].sort((a, b) => a.subject.name.localeCompare(b.subject.name)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export default function TeacherExams() {
  const [subjects, setSubjects] = useState(null)
  const [examsBySubject, setExamsBySubject] = useState({})
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    load()
  }, [])

  async function load() {
    setError('')
    try {
      const dashboard = await fetchTeacherDashboard()
      setSubjects(dashboard.subjects)

      const results = await Promise.all(
        dashboard.subjects.map((subject) => fetchTeacherSubjectExams(subject.id).catch(() => []))
      )
      const map = {}
      dashboard.subjects.forEach((subject, index) => {
        map[subject.id] = results[index]
      })
      setExamsBySubject(map)
    } catch {
      setError('Could not load your exams right now.')
    }
  }

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!subjects) {
    return <p className="student-status">Loading...</p>
  }

  const examGroups = groupByExam(subjects, examsBySubject)

  return (
    <div className="student-dashboard">
      <h1>Exams</h1>

      {examGroups.length === 0 ? (
        <p className="student-status">No exams have been scheduled by the admin yet.</p>
      ) : (
        examGroups.map((group) => {
          const hasEnded = examStatus(group.rows[0].exam) === 'ended'
          return (
          <section className="subject-exams-panel" key={group.rows[0].exam.exam_id}>
            <div className="subject-exams-heading-row">
              <h3 className="subject-exams-heading">
                {group.title}
                {group.className ? ` — ${group.className}` : ''}
              </h3>
              {hasEnded && (
                <Link
                  to={`/dashboard/my-exams/${group.rows[0].exam.exam_id}/results`}
                  className="subject-exams-results-link"
                >
                  View class results &rarr;
                </Link>
              )}
            </div>
            <ul className="assessment-mini-list">
              {group.rows.map(({ subject, exam }) => {
                const status = examStatus(exam)
                const totalQuestions = exam.sections.reduce((sum, s) => sum + s.questions.length, 0)
                return (
                  <li key={exam.id}>
                    <Link
                      to={`/dashboard/subjects/${subject.id}/exams/${exam.id}`}
                      state={{ subjectName: subject.name, backTo: '/dashboard/my-exams' }}
                      className="assessment-mini-link"
                    >
                      <span className="assessment-mini-row">
                        <span className="assessment-mini-title">{subject.name}</span>
                        <span className={`exam-status-pill exam-status-${status}`}>{EXAM_STATUS_LABEL[status]}</span>
                      </span>
                      <span className="assessment-mini-summary">
                        {exam.sections.length === 0
                          ? 'No questions submitted yet — add some'
                          : `${exam.sections.length} section${exam.sections.length === 1 ? '' : 's'} · ${totalQuestions} question${totalQuestions === 1 ? '' : 's'}`}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
          )
        })
      )}
    </div>
  )
}

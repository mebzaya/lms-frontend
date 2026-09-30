import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchStudentDashboard } from '../api/student'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { ReadingIcon, WritingIcon } from '../components/icons'
import { LESSON_STATUS_LABEL, lessonStatus } from '../utils/lessonStatus'
import '../styles/lessonStatus.css'
import './StudentDashboard.css'

function assessmentSummary(assessment) {
  if (assessment.latest_status === 'graded') return `Scored ${assessment.latest_score}/${assessment.max_score}`
  if (assessment.latest_status === 'submitted') return 'Awaiting grading'
  if (assessment.latest_status === 'in_progress') return 'In progress'
  return 'Not attempted'
}

function LessonRow({ lesson, subjectId, subjectName }) {
  const status = lessonStatus(lesson)
  // Carried by every link off this page so that page's own "back" link can
  // return here — to this specific subject's lesson list — instead of
  // dropping the student all the way out to the flat subject grid.
  const backState = { subjectId: Number(subjectId), subjectName }

  return (
    <li className={`lesson-item lesson-item-${status}`}>
      <div className="lesson-item-row">
        <span className="lesson-title">{lesson.title}</span>
      </div>
      <div className="lesson-item-badges">
        <span className={`lesson-status lesson-status-${status}`}>{LESSON_STATUS_LABEL[status]}</span>
        {lesson.content_released_at && (
          <Link to={`/dashboard/lessons/${lesson.id}/read`} state={backState} className="lesson-read-link">
            Read lesson
          </Link>
        )}
      </div>

      {lesson.assessments.length > 0 && (
        <ul className="assessment-mini-list">
          {lesson.assessments.map((assessment) => (
            <li key={assessment.id}>
              <Link to={`/dashboard/assessments/${assessment.id}`} state={backState} className="assessment-mini-link">
                <span className="assessment-mini-row">
                  {assessment.type === 'reading' ? <ReadingIcon /> : <WritingIcon />}
                  <span className="assessment-mini-title">{assessment.title}</span>
                </span>
                <span className="assessment-mini-summary">{assessmentSummary(assessment)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function StudentSubjectLessons() {
  const { subjectId } = useParams()
  const location = useLocation()

  const [subject, setSubject] = useState(null)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchStudentDashboard()
      .then((data) => {
        const match = data.subjects.find((s) => String(s.id) === subjectId)
        if (match) {
          setSubject(match)
        } else {
          setError('That subject could not be found.')
        }
      })
      .catch(() => setError('Could not load lessons right now.'))
  }, [subjectId])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!subject) {
    return <p className="student-status">Loading...</p>
  }

  const liveLessons = subject.lessons.filter((l) => l.is_active)
  const pastLessons = subject.lessons.filter((l) => !l.is_active)

  return (
    <div className="student-dashboard">
      <Link to="/dashboard" className="back-link">
        &larr; Back to dashboard
      </Link>
      <h1>{location.state?.subjectName ?? subject.name}</h1>

      {subject.lessons.length === 0 ? (
        <p className="student-status">No lessons yet — check back once your teacher starts one.</p>
      ) : (
        <>
          {liveLessons.length > 0 && (
            <section className="subject-exams-panel">
              <h3 className="subject-exams-heading">Live now</h3>
              <ol className="lesson-list lesson-list-standalone">
                {liveLessons.map((lesson) => (
                  <LessonRow
                    lesson={lesson}
                    subjectId={subjectId}
                    subjectName={location.state?.subjectName ?? subject.name}
                    key={lesson.id}
                  />
                ))}
              </ol>
            </section>
          )}

          {pastLessons.length > 0 && (
            <section className="subject-exams-panel">
              <h3 className="subject-exams-heading">Past lessons</h3>
              <ol className="lesson-list lesson-list-standalone">
                {pastLessons.map((lesson) => (
                  <LessonRow
                    lesson={lesson}
                    subjectId={subjectId}
                    subjectName={location.state?.subjectName ?? subject.name}
                    key={lesson.id}
                  />
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchAdminSubjectExam } from '../../api/adminExams'
import { ArrowDownIcon, ReadingIcon, WritingIcon } from '../../components/icons'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import '../../styles/modeBadge.css'
import '../TeacherAssessmentEditor.css'
import '../TeacherSubjectExam.css'
import './admin.css'

const QUESTION_TYPE_LABELS = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / False',
  short_answer: 'Short answer',
  fill_in_blank: 'Fill in the blank',
  written_response: 'Written response',
}

const SECTION_TYPE_LABEL = {
  reading: 'Reading',
  fill_in_blank: 'Fill in the Blanks',
  true_false: 'True / False',
  writing: 'Writing',
}

function attemptStatusLabel(attempt) {
  if (attempt.status === 'graded') return `Graded · ${attempt.score}/${attempt.max_score}`
  if (attempt.status === 'submitted') return 'Awaiting grading'
  return 'In progress'
}

export default function AdminSubjectExamDetail() {
  const { examId, subjectExamId } = useParams()
  const location = useLocation()

  const classId = location.state?.classId

  const [subjectExam, setSubjectExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('questions')
  const [expandedSectionId, setExpandedSectionId] = useState(null)
  const [selectedStudentAttemptId, setSelectedStudentAttemptId] = useState(null)

  useEffectDeduped(() => {
    fetchAdminSubjectExam(subjectExamId)
      .then(setSubjectExam)
      .catch(() => setError('Could not load this subject exam.'))
      .finally(() => setIsLoading(false))
  }, [subjectExamId])

  const answersByQuestionId = useMemo(() => {
    if (!subjectExam) return {}
    const attempt = subjectExam.attempts.find((a) => a.id === selectedStudentAttemptId)
    if (!attempt) return {}
    return Object.fromEntries(attempt.answers.map((a) => [a.question_id, a]))
  }, [subjectExam, selectedStudentAttemptId])

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!subjectExam) {
    return <p className="student-status auth-error">{error}</p>
  }

  const selectedAttempt = subjectExam.attempts.find((a) => a.id === selectedStudentAttemptId) ?? null

  return (
    <div className="admin-page">
      {!selectedAttempt && (
        <Link to={`/admin/exams/${examId}/subjects`} state={{ classId }} className="back-link">
          &larr; Back to subject status
        </Link>
      )}
      <h1>
        {subjectExam.title} — {subjectExam.subject.name}
      </h1>

      {error && <p className="auth-error">{error}</p>}

      <div className="exam-review-tabs">
        <button
          type="button"
          className={`exam-review-tab${tab === 'questions' ? ' exam-review-tab-active' : ''}`}
          onClick={() => setTab('questions')}
        >
          Questions ({subjectExam.sections.reduce((sum, s) => sum + s.questions.length, 0)})
        </button>
        <button
          type="button"
          className={`exam-review-tab${tab === 'answers' ? ' exam-review-tab-active' : ''}`}
          onClick={() => setTab('answers')}
        >
          Student answers ({subjectExam.attempts.length})
        </button>
      </div>

      {tab === 'questions' &&
        (subjectExam.sections.length === 0 ? (
          <p className="student-status">No sections submitted yet.</p>
        ) : (
          <div className="assessment-list">
            {subjectExam.sections.map((section) => {
              const isExpanded = expandedSectionId === section.id
              return (
                <div className="assessment-card" key={section.id}>
                  <div className="assessment-card-top">
                    <span className="subject-icon">
                      {section.type === 'writing' ? <WritingIcon /> : <ReadingIcon />}
                    </span>
                    <div className="assessment-card-info">
                      <div className="assessment-card-title-row">
                        <p className="assessment-card-title">{section.title}</p>
                      </div>
                      <p className="assessment-card-meta">
                        {SECTION_TYPE_LABEL[section.type] ?? section.type} · {section.questions.length} question(s)
                        {section.questions.length > 0 &&
                          ` · ${section.questions.reduce((sum, q) => sum + q.points, 0)} pts`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="questions-toggle"
                    onClick={() => setExpandedSectionId((prev) => (prev === section.id ? null : section.id))}
                    aria-expanded={isExpanded}
                  >
                    <span className="questions-toggle-label">
                      {isExpanded ? 'Hide questions' : `View questions (${section.questions.length})`}
                    </span>
                    <span className={`subject-chevron${isExpanded ? ' open' : ''}`}>
                      <ArrowDownIcon />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="question-manager">
                      {section.questions.length === 0 && <p className="student-status">No questions yet.</p>}

                      {section.questions.length > 0 && (
                        <ul className="question-manage-list">
                          {section.questions.map((question) => (
                            <li key={question.id}>
                              <span className="question-manage-type">
                                {QUESTION_TYPE_LABELS[question.type] ?? question.type}
                              </span>
                              <span className="question-manage-prompt">{question.prompt}</span>
                              <span className="question-manage-points">{question.points} pts</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

      {tab === 'answers' &&
        (subjectExam.attempts.length === 0 ? (
          <p className="student-status">No students have attempted this exam yet.</p>
        ) : !selectedAttempt ? (
          <div className="grading-option-grid">
            {subjectExam.attempts.map((attempt) => (
              <button
                type="button"
                key={attempt.id}
                className="grading-option-card"
                onClick={() => setSelectedStudentAttemptId(attempt.id)}
              >
                <span className="grading-option-label">{attempt.student.name}</span>
                <span className="grading-option-meta">
                  <span
                    className={`answer-badge ${attempt.status === 'graded' ? 'graded-badge' : 'answer-pending'}`}
                  >
                    {attemptStatusLabel(attempt)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button type="button" className="grading-back-button" onClick={() => setSelectedStudentAttemptId(null)}>
              &larr; Back to students
            </button>
            <h2 className="grading-step-heading">
              {selectedAttempt.student.name} — {attemptStatusLabel(selectedAttempt)}
            </h2>

            <div className="assessment-list">
              {subjectExam.sections.map((section) => (
                <div className="assessment-card" key={section.id}>
                  <div className="assessment-card-top">
                    <div className="assessment-card-info">
                      <p className="assessment-card-title">{section.title}</p>
                    </div>
                  </div>

                  <ul className="exam-review-question-list">
                    {section.questions.map((question, index) => {
                      const answer = answersByQuestionId[question.id]
                      return (
                        <li className="exam-review-question" key={question.id}>
                          <div className="exam-review-question-head">
                            <span className="question-manage-type">
                              {QUESTION_TYPE_LABELS[question.type] ?? question.type}
                            </span>
                            <span className="question-manage-points">{question.points} pts</span>
                          </div>
                          <p className="exam-review-question-prompt">
                            {index + 1}. {question.prompt}
                          </p>

                          {!answer ? (
                            <p className="exam-review-answer">No response.</p>
                          ) : (
                            <>
                              <p className="exam-review-answer">Response: {answer.response_text || '—'}</p>
                              {question.type === 'written_response' ? (
                                answer.points_awarded === null ? (
                                  <span className="answer-badge answer-pending">Awaiting grading</span>
                                ) : (
                                  <>
                                    <span className="answer-badge graded-badge">
                                      {answer.points_awarded}/{question.points} pts
                                    </span>
                                    {answer.feedback && <p className="exam-review-answer">Feedback: {answer.feedback}</p>}
                                  </>
                                )
                              ) : (
                                <span className={`answer-badge ${answer.is_correct ? 'graded-badge' : 'answer-pending'}`}>
                                  {answer.is_correct ? 'Correct' : 'Incorrect'} · {answer.points_awarded}/
                                  {question.points} pts
                                </span>
                              )}
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ))}
    </div>
  )
}

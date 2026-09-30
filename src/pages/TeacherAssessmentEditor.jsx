import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { deleteAssessment, deleteQuestion, fetchTeacherAssessments } from '../api/assessments'
import { ArrowDownIcon, PencilIcon, ReadingIcon, TrashIcon, WritingIcon } from '../components/icons'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'

const QUESTION_TYPE_LABELS = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / False',
  short_answer: 'Short answer',
  fill_in_blank: 'Fill in the blank',
  written_response: 'Written response',
}

const ASSESSMENT_TYPE_LABEL = {
  reading: 'Reading',
  fill_in_blank: 'Fill in the Blanks',
  true_false: 'True / False',
  writing: 'Writing',
}

export default function TeacherAssessmentEditor() {
  const { lessonId } = useParams()
  const location = useLocation()

  const [assessments, setAssessments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [expandedAssessmentId, setExpandedAssessmentId] = useState(
    location.state?.expandAssessmentId ? Number(location.state.expandAssessmentId) : null
  )

  useEffectDeduped(() => {
    loadAssessments()
  }, [])

  async function loadAssessments() {
    setIsLoading(true)
    setListError('')
    try {
      setAssessments(await fetchTeacherAssessments(lessonId))
    } catch {
      setListError('Could not load assessments for this lesson.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(assessment) {
    if (!window.confirm(`Delete "${assessment.title}"? This can't be undone.`)) return

    try {
      await deleteAssessment(assessment.id)
      await loadAssessments()
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Could not delete that assessment.')
    }
  }

  function toggleQuestions(assessmentId) {
    setExpandedAssessmentId((prev) => (prev === assessmentId ? null : assessmentId))
  }

  async function handleDeleteQuestion(question) {
    if (!window.confirm('Delete this question?')) return

    try {
      await deleteQuestion(question.id)
      await loadAssessments()
    } catch {
      setListError('Could not delete that question.')
    }
  }

  // Forwarded to every child page (assessment/question create+edit) so that
  // however many levels deep a teacher goes, backing all the way out still
  // restores the exact class/subject they drilled in from on the dashboard —
  // not just this lesson's title.
  const lessonState = {
    lessonTitle: location.state?.lessonTitle,
    classId: location.state?.classId,
    subjectId: location.state?.subjectId,
  }

  return (
    <div className="admin-page">
      <Link to="/dashboard" state={lessonState} className="back-link">
        &larr; Back to lessons
      </Link>
      <h1>Assessments for {location.state?.lessonTitle ?? `lesson #${lessonId}`}</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Assessments</h2>
            <Link
              to={`/dashboard/lessons/${lessonId}/assessments/new`}
              state={lessonState}
              className="auth-submit add-button"
            >
              + Add assessment
            </Link>
          </div>

          {listError && <p className="auth-error">{listError}</p>}

          {isLoading ? (
            <p className="student-status">Loading...</p>
          ) : assessments.length === 0 ? (
            <p className="student-status">No assessments yet — click "Add assessment" to create one.</p>
          ) : (
            <div className="assessment-list">
              {assessments.map((assessment) => {
                const isExpanded = expandedAssessmentId === assessment.id

                return (
                  <div className="assessment-card" key={assessment.id}>
                    <div className="assessment-card-top">
                      <span className="subject-icon">
                        {assessment.type === 'writing' ? <WritingIcon /> : <ReadingIcon />}
                      </span>
                      <div className="assessment-card-info">
                        <div className="assessment-card-title-row">
                          <p className="assessment-card-title">{assessment.title}</p>
                        </div>
                        <p className="assessment-card-meta">
                          {ASSESSMENT_TYPE_LABEL[assessment.type] ?? assessment.type} · {assessment.questions.length} question(s)
                        </p>
                      </div>
                      <div className="assessment-card-actions">
                        <Link
                          to={`/dashboard/lessons/${lessonId}/assessments/${assessment.id}/edit`}
                          state={{ ...lessonState, record: assessment }}
                          className="icon-button"
                          aria-label={`Edit ${assessment.title}`}
                        >
                          <PencilIcon />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => handleDelete(assessment)}
                          aria-label={`Delete ${assessment.title}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="questions-toggle"
                      onClick={() => toggleQuestions(assessment.id)}
                      aria-expanded={isExpanded}
                    >
                      <span className="questions-toggle-label">
                        {isExpanded ? 'Hide questions' : `Manage questions (${assessment.questions.length})`}
                      </span>
                      <span className={`subject-chevron${isExpanded ? ' open' : ''}`}>
                        <ArrowDownIcon />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="question-manager">
                        <Link
                          to={`/dashboard/lessons/${lessonId}/assessments/${assessment.id}/questions/new`}
                          state={{
                            ...lessonState,
                            assessmentTitle: assessment.title,
                            assessmentType: assessment.type,
                          }}
                          className="auth-submit add-button"
                        >
                          + Add question
                        </Link>

                        {assessment.questions.length === 0 && (
                          <p className="student-status">No questions yet.</p>
                        )}

                        {assessment.questions.length > 0 && (
                          <ul className="question-manage-list">
                            {assessment.questions.map((question) => (
                              <li key={question.id}>
                                <span className="question-manage-type">
                                  {QUESTION_TYPE_LABELS[question.type] ?? question.type}
                                </span>
                                <span className="question-manage-prompt">{question.prompt}</span>
                                <span className="question-manage-points">{question.points} pts</span>
                                <Link
                                  to={`/dashboard/lessons/${lessonId}/assessments/${assessment.id}/questions/${question.id}/edit`}
                                  state={{
                                    ...lessonState,
                                    record: question,
                                    assessmentTitle: assessment.title,
                                    assessmentType: assessment.type,
                                  }}
                                  className="icon-button"
                                  aria-label="Edit question"
                                >
                                  <PencilIcon />
                                </Link>
                                <button
                                  type="button"
                                  className="icon-button icon-button-danger"
                                  onClick={() => handleDeleteQuestion(question)}
                                  aria-label="Delete question"
                                >
                                  <TrashIcon />
                                </button>
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
          )}
        </div>
      </section>
    </div>
  )
}

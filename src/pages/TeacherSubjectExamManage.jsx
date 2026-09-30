import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  deleteExamQuestion,
  deleteExamSection,
  fetchTeacherSubjectExams,
  submitSubjectExam,
  unsubmitSubjectExam,
} from '../api/subjectExams'
import { ArrowDownIcon, PencilIcon, ReadingIcon, TrashIcon, WritingIcon } from '../components/icons'
import ExamContextBar from '../components/ExamContextBar'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { EXAM_STATUS_LABEL, examStatus } from '../utils/examStatus'
import { formatNepaliDateTime } from '../utils/nepaliDateTime'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'
import './TeacherSubjectExam.css'

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

export default function TeacherSubjectExamManage() {
  const { subjectId, examId } = useParams()
  const location = useLocation()

  const [exam, setExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSectionId, setExpandedSectionId] = useState(null)
  const [isSubmittingExam, setIsSubmittingExam] = useState(false)

  // Reached two ways: via the subject exam list (default), or directly from
  // the "Exams" sidebar overview (TeacherExams.jsx), which sets backTo so
  // this page's back-link returns to whichever one the teacher actually
  // came from instead of always inserting the list as an extra step.
  const backTo = location.state?.backTo ?? `/dashboard/subjects/${subjectId}/exams`
  const backState = { subjectName: location.state?.subjectName, classId: location.state?.classId }

  useEffectDeduped(() => {
    load()
  }, [examId])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      const exams = await fetchTeacherSubjectExams(subjectId)
      const match = exams.find((e) => String(e.id) === examId)
      if (match) {
        setExam(match)
      } else {
        setError('That exam could not be found.')
      }
    } catch {
      setError('Could not load that exam.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteSection(section) {
    if (!window.confirm(`Delete section "${section.title}"? This can't be undone.`)) return

    try {
      await deleteExamSection(section.id)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not delete that section.')
    }
  }

  async function handleDeleteQuestion(question) {
    if (!window.confirm('Delete this question?')) return

    try {
      await deleteExamQuestion(question.id)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not delete that question.')
    }
  }

  async function handleSubmitExam() {
    setIsSubmittingExam(true)
    setError('')
    try {
      await submitSubjectExam(examId)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? "Could not submit this subject's questions.")
    } finally {
      setIsSubmittingExam(false)
    }
  }

  async function handleUnsubmitExam() {
    setIsSubmittingExam(true)
    setError('')
    try {
      await unsubmitSubjectExam(examId)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not unsubmit.')
    } finally {
      setIsSubmittingExam(false)
    }
  }

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!exam) {
    return <p className="student-status auth-error">{error}</p>
  }

  const status = examStatus(exam)
  const isPublished = Boolean(exam.published_at)
  const isSubmitted = Boolean(exam.submitted_at)
  const emptySections = exam.sections.filter((s) => s.questions.length === 0)
  const canSubmit = exam.sections.length > 0 && emptySections.length === 0
  // Reuses the exam-status-pill's draft/scheduled/live color scheme for this
  // subject's own submission progress — a separate thing from the exam-wide
  // schedule status above.
  const submissionPillStatus = isSubmitted ? 'live' : exam.sections.length > 0 ? 'scheduled' : 'draft'
  // Forwarded to every child page (section/question create+edit) so backing
  // all the way out still returns to wherever this page itself was reached
  // from — the subject exam list, or the "Exams" overview directly. Subject
  // and class names come straight from this page's own fetched exam data
  // (not whatever the previous page happened to pass in), so they're always
  // present and consistent no matter which route got here.
  const sectionState = {
    subjectName: exam.subject?.name,
    className: exam.subject?.school_class?.name,
    examTitle: exam.title,
    classId: location.state?.classId,
    backTo: location.state?.backTo,
  }

  return (
    <div className="admin-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to exams
      </Link>
      <h1>{exam.title}</h1>
      <ExamContextBar subjectName={exam.subject?.name} className={exam.subject?.school_class?.name} />

      {error && <p className="auth-error">{error}</p>}

      <section className="admin-panel admin-panel-single">
        <div className={`exam-publish-panel exam-publish-panel-${status}`}>
          <div className="exam-publish-status">
            <span className={`exam-status-pill exam-status-${status}`}>{EXAM_STATUS_LABEL[status]}</span>
            {isPublished && (
              <span className="exam-publish-window">
                {formatNepaliDateTime(exam.starts_at)} &rarr; {formatNepaliDateTime(exam.ends_at)}
              </span>
            )}
          </div>
        </div>
        <p className="mode-hint exam-publish-hint">
          {isPublished
            ? 'This exam is published by an admin. Ask them to unpublish it if a section or question needs fixing.'
            : 'This exam was scheduled by an admin — they publish it (with the opening/closing window) once you\'ve added its sections and questions below.'}
        </p>
        {exam.instructions && <p className="assessment-card-meta">{exam.instructions}</p>}
      </section>

      <section className="admin-panel admin-panel-single">
        <div className={`exam-publish-panel exam-publish-panel-${submissionPillStatus}`}>
          <div className="exam-publish-status">
            <span className={`exam-status-pill exam-status-${submissionPillStatus}`}>
              {isSubmitted ? 'Submitted' : exam.sections.length > 0 ? 'In Progress' : 'Not started'}
            </span>
            {isSubmitted && exam.submitted_at && (
              <span className="exam-publish-window">Submitted {formatNepaliDateTime(exam.submitted_at)}</span>
            )}
          </div>

          {!isPublished &&
            (isSubmitted ? (
              <button type="button" className="cancel-button" onClick={handleUnsubmitExam} disabled={isSubmittingExam}>
                {isSubmittingExam ? 'Unsubmitting...' : 'Unsubmit'}
              </button>
            ) : (
              <button
                type="button"
                className="auth-submit"
                onClick={handleSubmitExam}
                disabled={isSubmittingExam || !canSubmit}
              >
                {isSubmittingExam ? 'Submitting...' : 'Submit questions'}
              </button>
            ))}
        </div>
        {!isSubmitted && !isPublished && !canSubmit && (
          <p className="mode-hint exam-publish-hint">
            {exam.sections.length === 0
              ? 'Add at least one section before submitting.'
              : `These sections have no questions yet: ${emptySections.map((s) => s.title).join(', ')}.`}
          </p>
        )}
        {!isSubmitted && !isPublished && canSubmit && (
          <p className="mode-hint exam-publish-hint">
            Looks ready — submit your questions once you're done, so the admin can review and publish this exam.
          </p>
        )}
      </section>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Sections</h2>
            <Link
              to={`/dashboard/subjects/${subjectId}/exams/${examId}/sections/new`}
              state={sectionState}
              className="auth-submit add-button"
            >
              + Add section
            </Link>
          </div>
          {isPublished && (
            <p className="mode-hint exam-locked-hint">
              This exam is published — unpublish it first (above) to edit or delete a section or its questions.
            </p>
          )}

          {exam.sections.length === 0 ? (
            <p className="student-status">No sections yet — click "Add section" to create one.</p>
          ) : (
            <div className="assessment-list">
              {exam.sections.map((section) => {
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
                      <div className="assessment-card-actions">
                        <Link
                          to={`/dashboard/subjects/${subjectId}/exams/${examId}/sections/${section.id}/edit`}
                          state={{ record: section, ...sectionState }}
                          className="icon-button"
                          aria-label={`Edit ${section.title}`}
                        >
                          <PencilIcon />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => handleDeleteSection(section)}
                          aria-label={`Delete ${section.title}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="questions-toggle"
                      onClick={() => setExpandedSectionId((prev) => (prev === section.id ? null : section.id))}
                      aria-expanded={isExpanded}
                    >
                      <span className="questions-toggle-label">
                        {isExpanded ? 'Hide questions' : `Manage questions (${section.questions.length})`}
                      </span>
                      <span className={`subject-chevron${isExpanded ? ' open' : ''}`}>
                        <ArrowDownIcon />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="question-manager">
                        <Link
                          to={`/dashboard/subjects/${subjectId}/exams/${examId}/sections/${section.id}/questions/new`}
                          state={{ sectionTitle: section.title, sectionType: section.type, ...sectionState }}
                          className="auth-submit add-button"
                        >
                          + Add question
                        </Link>

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
                                <Link
                                  to={`/dashboard/subjects/${subjectId}/exams/${examId}/sections/${section.id}/questions/${question.id}/edit`}
                                  state={{
                                    record: question,
                                    sectionTitle: section.title,
                                    sectionType: section.type,
                                    ...sectionState,
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

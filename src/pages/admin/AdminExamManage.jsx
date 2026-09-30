import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { deleteAdminExam, fetchAdminExam, updateAdminExam } from '../../api/adminExams'
import ExamPublishPanel from '../../components/ExamPublishPanel'
import { TrashIcon } from '../../components/icons'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import '../TeacherAssessmentEditor.css'
import '../TeacherSubjectExam.css'
import './admin.css'

export default function AdminExamManage() {
  const { examId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const backTo = '/admin/exams'

  const [exam, setExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [detailsForm, setDetailsForm] = useState(null)
  const [isSavingDetails, setIsSavingDetails] = useState(false)

  // Preserves whatever class filter the admin had selected on the exams
  // list (including "All classes", i.e. no filter) so backing out lands
  // where they were, not wherever this exam happens to belong.
  const backState = { classId: location.state?.classId }

  useEffectDeduped(() => {
    load()
  }, [examId])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      const match = await fetchAdminExam(examId)
      setExam(match)
      setDetailsForm({ title: match.title, instructions: match.instructions ?? '' })
    } catch {
      setError('That exam could not be found.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveDetails(event) {
    event.preventDefault()
    setIsSavingDetails(true)
    setError('')
    try {
      await updateAdminExam(examId, {
        title: detailsForm.title,
        instructions: detailsForm.instructions || null,
      })
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not save exam details.')
    } finally {
      setIsSavingDetails(false)
    }
  }

  async function handleDeleteExam() {
    if (!window.confirm(`Delete "${exam.title}"? This can't be undone.`)) return

    try {
      await deleteAdminExam(examId)
      navigate(backTo, { state: backState })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not delete that exam.')
    }
  }

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!exam) {
    return <p className="student-status auth-error">{error}</p>
  }

  const hasAttempts = exam.subject_exams.some((se) => se.attempts.length > 0)

  return (
    <div className="admin-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to exams
      </Link>
      <h1>
        {exam.title}
        {exam.school_class ? ` — ${exam.school_class.name}` : ''}
      </h1>

      {error && <p className="auth-error">{error}</p>}

      <ExamPublishPanel exam={exam} onChange={setExam} />

      <section className="admin-panel admin-panel-single">
        <h2>Exam details</h2>
        <form onSubmit={handleSaveDetails} className="auth-form">
          <label>
            Title
            <input
              type="text"
              value={detailsForm.title}
              onChange={(e) => setDetailsForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>
          <label>
            Instructions (optional)
            <textarea
              value={detailsForm.instructions}
              onChange={(e) => setDetailsForm((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={3}
            />
          </label>
          <div className="user-form-actions">
            <button type="submit" className="auth-submit" disabled={isSavingDetails}>
              {isSavingDetails ? 'Saving...' : 'Save details'}
            </button>
            <button
              type="button"
              className="icon-button icon-button-danger"
              onClick={handleDeleteExam}
              disabled={hasAttempts}
              title={hasAttempts ? "Can't delete — students have already started this exam" : undefined}
            >
              <TrashIcon />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

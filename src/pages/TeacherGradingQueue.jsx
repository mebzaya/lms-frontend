import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchGradingQueue, gradeAssessmentAnswer } from '../api/assessments'
import { fetchSubjectExamGradingQueue, gradeSubjectExamAnswer } from '../api/subjectExams'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './TeacherGradingQueue.css'

// Normalizes a lesson-assessment written-response answer and a subject-exam
// written-response answer into one common shape, so the page can build one
// class -> term -> subject -> student drill-down tree out of both kinds of
// gradable work. "Term" here is the exam/assessment's own title (e.g.
// "First-Term") — there's no separate term field, the title *is* the term.
function normalizeAssessmentAnswer(answer) {
  const assessment = answer.question.assessment
  const lesson = assessment.lesson
  const subject = lesson.subject
  return {
    key: `assessment-answer-${answer.id}`,
    draftKey: `assessment-${answer.id}`,
    kind: 'assessment',
    className: subject.school_class.name,
    subjectName: subject.name,
    title: assessment.title,
    studentName: answer.attempt.student.name,
    isGraded: answer.points_awarded !== null,
    modeBadge: assessment.mode === 'exam' ? 'Exam' : 'Practice',
    meta: lesson.title,
    prompt: answer.question.prompt,
    responseText: answer.response_text,
    wordCount: answer.word_count,
    maxPoints: answer.question.points,
    currentScore: answer.points_awarded,
    currentFeedback: answer.feedback,
    sortAt: answer.graded_at ?? answer.created_at,
    raw: answer,
  }
}

function normalizeExamAnswer(answer) {
  const section = answer.question.section
  const exam = section.exam
  const subject = exam.subject
  return {
    key: `exam-answer-${answer.id}`,
    draftKey: `exam-${answer.id}`,
    kind: 'subject_exam',
    className: subject.school_class.name,
    subjectName: subject.name,
    title: exam.title,
    studentName: answer.attempt.student.name,
    isGraded: answer.points_awarded !== null,
    modeBadge: 'Exam',
    meta: section.title,
    prompt: answer.question.prompt,
    responseText: answer.response_text,
    wordCount: answer.word_count,
    maxPoints: answer.question.points,
    currentScore: answer.points_awarded,
    currentFeedback: answer.feedback,
    sortAt: answer.graded_at ?? answer.created_at,
    raw: answer,
  }
}

function pendingCount(items) {
  return items.filter((i) => !i.isGraded).length
}

// Class -> term (exam/assessment title) -> subject -> student -> items.
// Built once per load so each step of the wizard is just a lookup into this
// tree instead of re-filtering the flat item list on every click.
function buildGradingTree(items) {
  const classMap = new Map()

  items.forEach((item) => {
    if (!classMap.has(item.className)) classMap.set(item.className, new Map())
    const termMap = classMap.get(item.className)

    if (!termMap.has(item.title)) termMap.set(item.title, new Map())
    const subjectMap = termMap.get(item.title)

    if (!subjectMap.has(item.subjectName)) subjectMap.set(item.subjectName, new Map())
    const studentMap = subjectMap.get(item.subjectName)

    if (!studentMap.has(item.studentName)) studentMap.set(item.studentName, [])
    studentMap.get(item.studentName).push(item)
  })

  return Array.from(classMap.entries())
    .map(([className, termMap]) => {
      const terms = Array.from(termMap.entries())
        .map(([title, subjectMap]) => {
          const subjects = Array.from(subjectMap.entries())
            .map(([subjectName, studentMap]) => {
              const students = Array.from(studentMap.entries())
                .map(([studentName, studentItems]) => ({
                  studentName,
                  pendingCount: pendingCount(studentItems),
                  items: [...studentItems].sort((a, b) => {
                    if (a.isGraded !== b.isGraded) return a.isGraded ? 1 : -1
                    return new Date(a.sortAt) - new Date(b.sortAt)
                  }),
                }))
                .sort((a, b) => a.studentName.localeCompare(b.studentName))
              const allItems = students.flatMap((s) => s.items)
              return { subjectName, students, pendingCount: pendingCount(allItems), total: allItems.length }
            })
            .sort((a, b) => a.subjectName.localeCompare(b.subjectName))
          const allItems = subjects.flatMap((s) => s.students.flatMap((st) => st.items))
          return { title, subjects, pendingCount: pendingCount(allItems), total: allItems.length }
        })
        .sort((a, b) => a.title.localeCompare(b.title))
      const allItems = terms.flatMap((t) => t.subjects.flatMap((s) => s.students.flatMap((st) => st.items)))
      return { className, terms, pendingCount: pendingCount(allItems), total: allItems.length }
    })
    // numeric: true so "Class 9" sorts before "Class 10".
    .sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }))
}

function OptionCard({ label, total, pendingCount: pending, onClick }) {
  return (
    <button type="button" className="grading-option-card" onClick={onClick}>
      <span className="grading-option-label">{label}</span>
      <span className="grading-option-meta">
        {pending > 0 ? (
          <span className="answer-badge answer-pending">{pending} pending</span>
        ) : (
          <span className="answer-badge graded-badge">All graded</span>
        )}
        <span className="grading-option-count">
          {total} item{total === 1 ? '' : 's'}
        </span>
      </span>
    </button>
  )
}

export default function TeacherGradingQueue() {
  const [assessmentAnswers, setAssessmentAnswers] = useState(null)
  const [examAnswers, setExamAnswers] = useState(null)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState({ className: null, title: null, subjectName: null, studentName: null })
  const [expandedKey, setExpandedKey] = useState(null)
  const [scoreDrafts, setScoreDrafts] = useState({})
  const [feedbackDrafts, setFeedbackDrafts] = useState({})
  const [isSubmittingKey, setIsSubmittingKey] = useState(null)

  useEffectDeduped(() => {
    load()
  }, [])

  async function load() {
    try {
      const [lessonAnswers, examUngraded] = await Promise.all([
        fetchGradingQueue(),
        fetchSubjectExamGradingQueue(),
      ])
      setAssessmentAnswers(lessonAnswers)
      setExamAnswers(examUngraded)
    } catch {
      setError('Could not load the grading queue right now.')
    }
  }

  const tree = useMemo(() => {
    if (!assessmentAnswers || !examAnswers) return []
    const items = [
      ...assessmentAnswers.map(normalizeAssessmentAnswer),
      ...examAnswers.map(normalizeExamAnswer),
    ]
    return buildGradingTree(items)
  }, [assessmentAnswers, examAnswers])

  const selectedClass = tree.find((c) => c.className === selection.className) ?? null
  const selectedTerm = selectedClass?.terms.find((t) => t.title === selection.title) ?? null
  const selectedSubject = selectedTerm?.subjects.find((s) => s.subjectName === selection.subjectName) ?? null
  const selectedStudent = selectedSubject?.students.find((s) => s.studentName === selection.studentName) ?? null

  function goToClass(className) {
    setSelection({ className, title: null, subjectName: null, studentName: null })
  }

  function goToTerm(title) {
    setSelection((prev) => ({ ...prev, title, subjectName: null, studentName: null }))
  }

  function goToSubject(subjectName) {
    setSelection((prev) => ({ ...prev, subjectName, studentName: null }))
  }

  function goToStudent(studentName) {
    setSelection((prev) => ({ ...prev, studentName }))
  }

  function resetToRoot() {
    setSelection({ className: null, title: null, subjectName: null, studentName: null })
  }

  function toggleExpanded(item) {
    setExpandedKey((prev) => (prev === item.key ? null : item.key))
    // Prefill the form with the existing grade the first time an already-
    // graded item is opened, so reviewing/adjusting a past grade doesn't
    // start from a blank box.
    if (item.isGraded && scoreDrafts[item.draftKey] === undefined) {
      setScoreDrafts((prev) => ({ ...prev, [item.draftKey]: String(item.currentScore) }))
      setFeedbackDrafts((prev) => ({ ...prev, [item.draftKey]: item.currentFeedback ?? '' }))
    }
  }

  async function handleGrade(event, item) {
    event.preventDefault()
    setIsSubmittingKey(item.key)
    setError('')

    try {
      const gradeFn = item.kind === 'assessment' ? gradeAssessmentAnswer : gradeSubjectExamAnswer
      await gradeFn(item.raw.id, {
        points_awarded: Number(scoreDrafts[item.draftKey] ?? 0),
        feedback: feedbackDrafts[item.draftKey] || null,
      })
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not save that grade.')
    } finally {
      setIsSubmittingKey(null)
    }
  }

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!assessmentAnswers || !examAnswers) {
    return <p className="student-status">Loading...</p>
  }

  const crumbs = [{ label: 'Grading queue', onClick: resetToRoot }]
  if (selectedClass) crumbs.push({ label: selectedClass.className, onClick: () => goToClass(selectedClass.className) })
  if (selectedTerm) crumbs.push({ label: selectedTerm.title, onClick: () => goToTerm(selectedTerm.title) })
  if (selectedSubject) crumbs.push({ label: selectedSubject.subjectName, onClick: () => goToSubject(selectedSubject.subjectName) })
  if (selectedStudent) crumbs.push({ label: selectedStudent.studentName, onClick: null })

  return (
    <div className="grading-queue">
      {!selectedClass && (
        <Link to="/dashboard" className="back-link">
          &larr; Back to dashboard
        </Link>
      )}
      <h1>Grading queue</h1>

      <div className="grading-breadcrumbs">
        {crumbs.map((crumb, index) => (
          <span className="grading-crumb-wrap" key={crumb.label}>
            {index > 0 && <span className="grading-crumb-sep">/</span>}
            {crumb.onClick ? (
              <button type="button" className="grading-crumb" onClick={crumb.onClick}>
                {crumb.label}
              </button>
            ) : (
              <span className="grading-crumb grading-crumb-current">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {tree.length === 0 ? (
        <p className="student-status">Nothing to grade right now.</p>
      ) : !selectedClass ? (
        <>
          <h2 className="grading-step-heading">Choose a class</h2>
          <div className="grading-option-grid">
            {tree.map((c) => (
              <OptionCard
                key={c.className}
                label={c.className}
                total={c.total}
                pendingCount={c.pendingCount}
                onClick={() => goToClass(c.className)}
              />
            ))}
          </div>
        </>
      ) : !selectedTerm ? (
        <>
          <h2 className="grading-step-heading">Choose a term — {selectedClass.className}</h2>
          <div className="grading-option-grid">
            {selectedClass.terms.map((t) => (
              <OptionCard
                key={t.title}
                label={t.title}
                total={t.total}
                pendingCount={t.pendingCount}
                onClick={() => goToTerm(t.title)}
              />
            ))}
          </div>
        </>
      ) : !selectedSubject ? (
        <>
          <h2 className="grading-step-heading">Choose a subject — {selectedTerm.title}</h2>
          <div className="grading-option-grid">
            {selectedTerm.subjects.map((s) => (
              <OptionCard
                key={s.subjectName}
                label={s.subjectName}
                total={s.total}
                pendingCount={s.pendingCount}
                onClick={() => goToSubject(s.subjectName)}
              />
            ))}
          </div>
        </>
      ) : !selectedStudent ? (
        <>
          <h2 className="grading-step-heading">Choose a student — {selectedSubject.subjectName}</h2>
          <div className="grading-option-grid">
            {selectedSubject.students.map((s) => (
              <OptionCard
                key={s.studentName}
                label={s.studentName}
                total={s.items.length}
                pendingCount={s.pendingCount}
                onClick={() => goToStudent(s.studentName)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="grading-step-heading">{selectedStudent.studentName}'s answers</h2>

          <div className="grading-list">
            {selectedStudent.items.map((item) => {
              const isExpanded = expandedKey === item.key
              return (
                <div className="grading-card" key={item.key}>
                  <button type="button" className="grading-card-header" onClick={() => toggleExpanded(item)}>
                    <div className="grading-header-text">
                      <p className="grading-student">
                        <span className={`mode-badge mode-badge-${item.modeBadge === 'Exam' ? 'exam' : 'practice'}`}>
                          {item.modeBadge}
                        </span>
                        {item.isGraded ? (
                          <span className="answer-badge graded-badge">
                            Graded · {item.currentScore}/{item.maxPoints}
                          </span>
                        ) : (
                          <span className="answer-badge answer-pending">Awaiting grading</span>
                        )}
                      </p>
                      <p className="grading-meta">{item.meta}</p>
                      {item.prompt && <p className="grading-meta">{item.prompt}</p>}
                    </div>
                    <span className="grading-word-count">{item.wordCount} words</span>
                  </button>

                  {isExpanded && (
                    <div className="grading-body">
                      <p className="grading-response">{item.responseText}</p>

                      <form onSubmit={(e) => handleGrade(e, item)} className="auth-form">
                        <label>
                          Score (out of {item.maxPoints})
                          <input
                            type="number"
                            min={0}
                            max={item.maxPoints}
                            value={scoreDrafts[item.draftKey] ?? ''}
                            onChange={(e) => setScoreDrafts((prev) => ({ ...prev, [item.draftKey]: e.target.value }))}
                            required
                          />
                        </label>

                        <label>
                          Feedback (optional)
                          <textarea
                            rows={3}
                            value={feedbackDrafts[item.draftKey] ?? ''}
                            onChange={(e) =>
                              setFeedbackDrafts((prev) => ({ ...prev, [item.draftKey]: e.target.value }))
                            }
                          />
                        </label>

                        <button type="submit" className="auth-submit" disabled={isSubmittingKey === item.key}>
                          {isSubmittingKey === item.key ? 'Saving...' : item.isGraded ? 'Update grade' : 'Submit grade'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

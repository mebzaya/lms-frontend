import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchTeacherSubjectExams, updateExamQuestion } from '../api/subjectExams'
import ExamContextBar from '../components/ExamContextBar'
import NepaliTypingGuide from '../components/NepaliTypingGuide'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { applyNepaliBoundaryConversion, finalizeNepaliText } from '../utils/nepaliTransliteration'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'

const NEPALI_TYPING_STORAGE_KEY = 'lms_teacher_nepali_typing'

const QUESTION_TYPE_LABELS = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / False',
  short_answer: 'Short answer',
  fill_in_blank: 'Fill in the blank',
  written_response: 'Written response',
}

function toEditState(question) {
  const optionLabels = ['', '', '', '']
  let correctOptionIndex = 0

  if (question.type === 'multiple_choice') {
    ;(question.options ?? []).forEach((option) => {
      const index = 'abcd'.indexOf(option.key)
      if (index >= 0 && index < optionLabels.length) optionLabels[index] = option.label
    })
    const matchedIndex = 'abcd'.indexOf(question.correct_answer)
    correctOptionIndex = matchedIndex >= 0 ? matchedIndex : 0
  }

  return {
    type: question.type,
    answerLanguage: question.answer_language ?? 'english',
    fields: {
      prompt: question.prompt,
      optionLabels,
      correctOptionIndex,
      correctAnswer: question.type === 'short_answer' ? question.correct_answer : '',
      blankAnswers: question.type === 'fill_in_blank' ? question.correct_answer.split(';') : [''],
      trueFalseAnswer: question.type === 'true_false' ? question.correct_answer : 'true',
      min_word_count: question.min_word_count ?? '',
      max_word_count: question.max_word_count ?? '',
      points: String(question.points),
    },
  }
}

// A fill_in_blank/true_false/writing section restricts every question in it
// to that one type, so the type selector is locked instead of shown.
function forcedTypeFor(sectionType) {
  if (sectionType === 'fill_in_blank' || sectionType === 'true_false') return sectionType
  if (sectionType === 'writing') return 'written_response'
  return null
}

export default function TeacherSubjectExamQuestionEdit() {
  const { subjectId, examId, sectionId, questionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const initial = location.state?.record ? toEditState(location.state.record) : null

  const [sectionTitle] = useState(location.state?.sectionTitle ?? '')
  const [forcedType, setForcedType] = useState(forcedTypeFor(location.state?.sectionType))
  const [type, setType] = useState(initial?.type ?? 'multiple_choice')
  const [answerLanguage, setAnswerLanguage] = useState(initial?.answerLanguage ?? 'english')
  const [fields, setFields] = useState(
    initial?.fields ?? {
      prompt: '',
      optionLabels: ['', '', '', ''],
      correctOptionIndex: 0,
      correctAnswer: '',
      blankAnswers: [''],
      trueFalseAnswer: 'true',
      min_word_count: '',
      max_word_count: '',
      points: '5',
    }
  )
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoaded, setIsLoaded] = useState(Boolean(initial))
  const [nepaliTyping, setNepaliTyping] = useState(() => {
    try {
      return localStorage.getItem(NEPALI_TYPING_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  function toggleNepaliTyping() {
    setNepaliTyping((prev) => {
      const next = !prev
      try {
        localStorage.setItem(NEPALI_TYPING_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // per-viewer convenience only — fine if storage is unavailable
      }
      return next
    })
  }

  function nextTypedValue(rawValue) {
    return nepaliTyping && answerLanguage === 'nepali' ? applyNepaliBoundaryConversion(rawValue) : rawValue
  }

  function finalizeTypedValue(rawValue) {
    const value = nepaliTyping && answerLanguage === 'nepali' ? finalizeNepaliText(rawValue) : rawValue
    return value.trim()
  }

  const backTo = `/dashboard/subjects/${subjectId}/exams/${examId}`
  const backState = {
    subjectName: location.state?.subjectName,
    examTitle: location.state?.examTitle,
    classId: location.state?.classId,
    backTo: location.state?.backTo,
  }

  const blankCount = type === 'fill_in_blank' ? (fields.prompt.match(/_{3,}/g) ?? []).length : 0

  useEffectDeduped(() => {
    if (isLoaded) return
    fetchTeacherSubjectExams(subjectId)
      .then((exams) => {
        const exam = exams.find((e) => String(e.id) === examId)
        const section = exam?.sections.find((s) => String(s.id) === sectionId)
        const question = section?.questions.find((q) => String(q.id) === questionId)
        if (question) {
          const state = toEditState(question)
          setType(state.type)
          setAnswerLanguage(state.answerLanguage)
          setFields(state.fields)
          setForcedType(forcedTypeFor(section.type))
          setIsLoaded(true)
        } else {
          setLoadError('That question could not be found.')
        }
      })
      .catch(() => setLoadError('Could not load that question.'))
  }, [subjectId, examId, sectionId, questionId])

  function handleFieldChange(event) {
    const { name, value } = event.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  function handleOptionChange(index, value) {
    setFields((prev) => {
      const optionLabels = [...prev.optionLabels]
      optionLabels[index] = value
      return { ...prev, optionLabels }
    })
  }

  function handleBlankAnswerChange(index, value) {
    setFields((prev) => {
      const blankAnswers = [...prev.blankAnswers]
      blankAnswers[index] = nextTypedValue(value)
      return { ...prev, blankAnswers }
    })
  }

  function handleBlankAnswerBlur(index, value) {
    setFields((prev) => {
      const blankAnswers = [...prev.blankAnswers]
      blankAnswers[index] = finalizeTypedValue(value)
      return { ...prev, blankAnswers }
    })
  }

  function handleCorrectAnswerChange(event) {
    setFields((prev) => ({ ...prev, correctAnswer: nextTypedValue(event.target.value) }))
  }

  function handleCorrectAnswerBlur(event) {
    setFields((prev) => ({ ...prev, correctAnswer: finalizeTypedValue(event.target.value) }))
  }

  function handleAnswerLanguageChange(event) {
    const nextLanguage = event.target.value
    setAnswerLanguage(nextLanguage)
    if (nextLanguage === 'nepali') {
      setNepaliTyping(true)
      try {
        localStorage.setItem(NEPALI_TYPING_STORAGE_KEY, '1')
      } catch {
        // per-viewer convenience only
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    try {
      const payload = {
        type,
        answer_language: answerLanguage,
        prompt: fields.prompt,
        points: Number(fields.points || 1),
      }

      if (type === 'multiple_choice') {
        const options = fields.optionLabels
          .map((label, index) => ({ key: 'abcd'[index], label: label.trim() }))
          .filter((option) => option.label !== '')

        if (options.length < 2) {
          setFormError('Add at least two options.')
          return
        }

        payload.options = options
        payload.correct_answer = 'abcd'[fields.correctOptionIndex]
        payload.answer_language = 'english'

        if (!options.some((option) => option.key === payload.correct_answer)) {
          setFormError('Select a correct option that has text.')
          return
        }
      } else if (type === 'true_false') {
        payload.correct_answer = fields.trueFalseAnswer
        payload.answer_language = 'english'
      } else if (type === 'fill_in_blank') {
        if (blankCount === 0) {
          setFormError('Add at least one blank (___) to the prompt.')
          return
        }

        const blankAnswers = Array.from({ length: blankCount }, (_, index) =>
          finalizeTypedValue(fields.blankAnswers[index] ?? '').trim()
        )

        if (blankAnswers.some((answer) => answer === '')) {
          setFormError('Enter a correct answer for every blank.')
          return
        }

        payload.correct_answer = blankAnswers.join(';')
      } else if (type === 'written_response') {
        payload.correct_answer = null
        payload.min_word_count = fields.min_word_count ? Number(fields.min_word_count) : null
        payload.max_word_count = fields.max_word_count ? Number(fields.max_word_count) : null
      } else {
        payload.correct_answer = finalizeTypedValue(fields.correctAnswer)
      }

      setIsSubmitting(true)
      await updateExamQuestion(questionId, payload)
      navigate(backTo, { state: backState })
    } catch (err) {
      setFormError(
        err.response?.data?.message ??
          Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
          'Could not save that question.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-page form-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to exam
      </Link>
      <h1>Edit question</h1>
      <ExamContextBar
        subjectName={location.state?.subjectName}
        className={location.state?.className}
        examTitle={location.state?.examTitle}
        sectionTitle={sectionTitle}
      />

      <div className="user-form-card">
        {loadError && <p className="auth-error">{loadError}</p>}

        {type !== 'multiple_choice' && type !== 'true_false' && answerLanguage === 'nepali' && isLoaded && (
          <div className="nepali-toggle-wrap">
            <button
              type="button"
              className={`nepali-toggle${nepaliTyping ? ' active' : ''}`}
              onClick={toggleNepaliTyping}
            >
              {nepaliTyping ? '✓ नेपाली टाइपिङ चालु छ' : 'Type in Nepali (नेपाली)'}
            </button>
            {nepaliTyping && <NepaliTypingGuide />}
          </div>
        )}

        {isLoaded && (
          <form onSubmit={handleSubmit} className="auth-form">
            {forcedType ? (
              <p className="mode-hint">
                This section only accepts {QUESTION_TYPE_LABELS[forcedType]} questions.
              </p>
            ) : (
              <label>
                Question type
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short answer</option>
                  <option value="fill_in_blank">Fill in the blank</option>
                  <option value="written_response">Written response</option>
                </select>
              </label>
            )}

            {type !== 'multiple_choice' && type !== 'true_false' && (
              <label>
                Expected answer language
                <select value={answerLanguage} onChange={handleAnswerLanguageChange}>
                  <option value="english">English</option>
                  <option value="nepali">Nepali (Unicode)</option>
                </select>
                <span className="mode-hint">
                  {answerLanguage === 'nepali'
                    ? 'Students will get a Nepali typing helper turned on by default for this question.'
                    : 'Students answer this question in plain English text.'}
                </span>
              </label>
            )}

            <label>
              Prompt
              <input
                type="text"
                name="prompt"
                value={fields.prompt}
                onChange={handleFieldChange}
                placeholder={type === 'fill_in_blank' ? 'The capital of France is ___.' : undefined}
                required
              />
              {type === 'fill_in_blank' && (
                <span className="mode-hint">Mark the blank with three or more underscores, e.g. ___.</span>
              )}
            </label>

            {type === 'multiple_choice' ? (
              <div className="option-editor">
                <span className="guardian-picker-label">Options — select the correct one</span>
                <div className="option-rows">
                  {fields.optionLabels.map((label, index) => {
                    const isSelected = fields.correctOptionIndex === index
                    return (
                      <label className={`option-row${isSelected ? ' selected' : ''}`} key={index}>
                        <input
                          type="radio"
                          name="correctOptionIndex"
                          checked={isSelected}
                          onChange={() => setFields((prev) => ({ ...prev, correctOptionIndex: index }))}
                        />
                        <span className="option-letter">{'ABCD'[index]}</span>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={label}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : type === 'true_false' ? (
              <div className="option-editor">
                <span className="guardian-picker-label">Correct answer</span>
                <div className="option-rows">
                  {['true', 'false'].map((value) => {
                    const isSelected = fields.trueFalseAnswer === value
                    return (
                      <label className={`option-row${isSelected ? ' selected' : ''}`} key={value}>
                        <input
                          type="radio"
                          name="trueFalseAnswer"
                          checked={isSelected}
                          onChange={() => setFields((prev) => ({ ...prev, trueFalseAnswer: value }))}
                        />
                        <span className="option-letter">{value === 'true' ? 'T' : 'F'}</span>
                        {value === 'true' ? 'True' : 'False'}
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : type === 'fill_in_blank' ? (
              <div className="blank-answer-editor">
                <span className="guardian-picker-label">
                  {blankCount > 0
                    ? `Correct answer${blankCount > 1 ? 's' : ''} for each blank`
                    : 'Add ___ to the prompt above to create a blank'}
                </span>
                {Array.from({ length: blankCount }).map((_, index) => (
                  <label className="blank-answer-row" key={index}>
                    <span className="blank-answer-index">Blank {index + 1}</span>
                    <input
                      type="text"
                      value={fields.blankAnswers[index] ?? ''}
                      onChange={(e) => handleBlankAnswerChange(index, e.target.value)}
                      onBlur={(e) => handleBlankAnswerBlur(index, e.target.value)}
                      placeholder="Paris (or Paris|paris)"
                      required
                    />
                  </label>
                ))}
                {blankCount > 0 && (
                  <span className="mode-hint">
                    Students can fill the blanks in any order — separate multiple accepted spellings
                    for the same blank with a |.
                  </span>
                )}
              </div>
            ) : type === 'written_response' ? (
              <div className="field-row">
                <label>
                  Min words (optional)
                  <input
                    type="number"
                    name="min_word_count"
                    value={fields.min_word_count}
                    onChange={handleFieldChange}
                    min={1}
                  />
                </label>
                <label>
                  Max words (optional)
                  <input
                    type="number"
                    name="max_word_count"
                    value={fields.max_word_count}
                    onChange={handleFieldChange}
                    min={1}
                  />
                </label>
                <span className="mode-hint">
                  No single correct answer — a teacher grades this by hand from the grading queue.
                </span>
              </div>
            ) : (
              <label>
                Correct answer
                <input
                  type="text"
                  name="correctAnswer"
                  value={fields.correctAnswer}
                  onChange={handleCorrectAnswerChange}
                  onBlur={handleCorrectAnswerBlur}
                  required
                />
                <span className="mode-hint">
                  Grading ignores case and simple plurals automatically (e.g. "root" also accepts "Root"/"roots").
                  List other accepted spellings separated by a | — e.g. colour|color.
                </span>
              </label>
            )}

            <label className="points-field">
              Points
              <input type="number" name="points" value={fields.points} onChange={handleFieldChange} min={1} />
            </label>

            {formError && <p className="auth-error">{formError}</p>}

            <div className="user-form-actions">
              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
              <Link to={backTo} state={backState} className="cancel-button">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

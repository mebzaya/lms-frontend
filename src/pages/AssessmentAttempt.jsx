import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchAssessment, startAttempt, submitAttempt } from '../api/student'
import { PlayIcon, ReadingIcon, WritingIcon } from '../components/icons'
import MarkdownText from '../components/MarkdownText'
import NepaliTypingGuide from '../components/NepaliTypingGuide'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { applyNepaliBoundaryConversion, finalizeNepaliText } from '../utils/nepaliTransliteration'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './AssessmentAttempt.css'

const NEPALI_TYPING_STORAGE_KEY = 'lms_nepali_typing'

const QUESTION_TYPE_INSTRUCTIONS = {
  multiple_choice: 'Solve the multiple choice questions.',
  true_false: 'Decide whether each statement is true or false.',
  short_answer: 'Answer the following questions.',
  fill_in_blank: 'Fill in the blanks.',
  written_response: 'Write your response to each of the following.',
}

const SECTION_LETTERS = 'ABCDEFGH'

// Groups consecutive-or-not questions by type (preserving first-seen order)
// so the heading/marks chip is shown once per type instead of per question.
function groupQuestionsByType(questions) {
  const groups = []
  const groupByType = new Map()

  questions.forEach((question) => {
    let group = groupByType.get(question.type)
    if (!group) {
      group = { type: question.type, totalPoints: 0, items: [] }
      groupByType.set(question.type, group)
      groups.push(group)
    }
    group.totalPoints += question.points
    group.items.push(question)
  })

  return groups
}

function shuffledCopy(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function scoreTier(percentage) {
  if (percentage >= 90) return { tone: 'great', emoji: '🎉', message: 'Excellent work!' }
  if (percentage >= 70) return { tone: 'good', emoji: '👍', message: 'Great job!' }
  if (percentage >= 50) return { tone: 'okay', emoji: '💪', message: 'Good effort!' }
  return { tone: 'low', emoji: '📚', message: 'Keep practicing!' }
}

export default function AssessmentAttempt() {
  const { assessmentId } = useParams()
  const location = useLocation()
  const [assessment, setAssessment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeAttempt, setActiveAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
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

  // Reading questions each declare their own expected language; so does
  // every written_response question in a writing assessment.
  function nextTypedValueForQuestion(question, rawValue) {
    return nepaliTyping && question.answer_language === 'nepali'
      ? applyNepaliBoundaryConversion(rawValue)
      : rawValue
  }

  function finalizeTypedValueForQuestion(question, rawValue) {
    // Fill-in-blank/short-answer boxes hold a single token, so trim
    // unconditionally — not just for Nepali answers — since the space the
    // converter leaves after a boundary keystroke, or just an accidental
    // stray space from normal typing, should never cause a right answer to
    // grade as wrong. The backend also normalizes this defensively; this is
    // just so the student doesn't see a lingering trailing space either.
    const value =
      nepaliTyping && question.answer_language === 'nepali' ? finalizeNepaliText(rawValue) : rawValue
    return value.trim()
  }

  useEffectDeduped(() => {
    load()
  }, [assessmentId])

  useEffectDeduped(() => {
    const expectsNepali = (assessment?.questions ?? []).some((question) => question.answer_language === 'nepali')

    if (expectsNepali) {
      setNepaliTyping(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.id])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      setAssessment(await fetchAssessment(assessmentId))
    } catch {
      setError('Could not load this assessment right now.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStart() {
    setError('')
    try {
      const attempt = await startAttempt(assessmentId)
      setActiveAttempt(attempt)
      setAnswers({})
      setResult(null)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not start a new attempt.')
    }
  }

  async function handleSubmitAnswers(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const payload = {
        answers: assessment.questions.map((question) => {
          const value = answers[question.id]
          const responseText = Array.isArray(value)
            ? value.map((part) => finalizeTypedValueForQuestion(question, part ?? '')).join(';')
            : finalizeTypedValueForQuestion(question, value ?? '')
          return { question_id: question.id, response_text: responseText }
        }),
      }
      const attempt = await submitAttempt(activeAttempt.id, payload)
      setResult(attempt)
      setActiveAttempt(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not submit your answers.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillInBlankWordBank = useMemo(() => {
    const hints = (assessment?.questions ?? [])
      .filter((question) => question.type === 'fill_in_blank' && question.answer_hint)
      .map((question) => question.answer_hint)
    return shuffledCopy(hints)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.id])

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!assessment) {
    return <p className="student-status auth-error">{error || 'Assessment not found.'}</p>
  }

  const attemptsExhausted =
    assessment.max_attempts !== null && assessment.attempts_used >= assessment.max_attempts

  const isWritingType = assessment.type === 'writing'
  const answeredCount = Object.keys(answers).length
  const totalQuestions = assessment.questions?.length ?? 0
  const attemptNumber = assessment.attempts_used + 1
  // Multiple choice and true/false never have anything for a student to
  // type, so their answer_language (always 'english', unused) doesn't count
  // here — only short-answer/fill-in-blank/written-response questions need
  // the typing helper.
  const hasNepaliQuestion = (assessment.questions ?? []).some(
    (question) =>
      question.type !== 'multiple_choice' &&
      question.type !== 'true_false' &&
      question.answer_language === 'nepali'
  )

  const backTo = location.state?.subjectId ? `/dashboard/subjects/${location.state.subjectId}/lessons` : '/dashboard'
  const backState = { subjectName: location.state?.subjectName }

  return (
    <div className="assessment-attempt">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to {location.state?.subjectName ?? 'dashboard'}
      </Link>

      <section className={`assessment-hero assessment-hero-${isWritingType ? 'writing' : 'reading'}`}>
        <span className="assessment-hero-icon">
          {isWritingType ? <WritingIcon /> : <ReadingIcon />}
        </span>
        <div className="assessment-hero-text">
          <div className="assessment-title-row">
            <h1>{assessment.title}</h1>
            {hasNepaliQuestion && <span className="mode-badge language-badge">नेपाली</span>}
          </div>
          <p className="assessment-hero-subtitle">
            Practice makes progress — retry as many times as you like to improve.
          </p>
          <span className="attempts-pill">
            {activeAttempt
              ? `Attempt ${attemptNumber}${assessment.max_attempts ? ` of ${assessment.max_attempts}` : ''}`
              : assessment.max_attempts
                ? `${assessment.attempts_used}/${assessment.max_attempts} attempts used`
                : `${assessment.attempts_used} attempt${assessment.attempts_used === 1 ? '' : 's'} so far`}
          </span>
        </div>
      </section>

      {assessment.instructions && (
        <MarkdownText as="p" className="assessment-instructions" text={assessment.instructions} />
      )}

      {error && <p className="auth-error">{error}</p>}

      {activeAttempt ? (
        <form onSubmit={handleSubmitAnswers} className="assessment-form">
          {(assessment.passage || assessment.prompt) && (
            <MarkdownText as="p" className="assessment-passage" text={assessment.passage || assessment.prompt} />
          )}

          {hasNepaliQuestion && (
            <>
              <button
                type="button"
                className={`nepali-toggle${nepaliTyping ? ' active' : ''}`}
                onClick={toggleNepaliTyping}
              >
                {nepaliTyping ? '✓ नेपाली टाइपिङ चालु छ' : 'Type in Nepali (नेपाली)'}
              </button>
              {nepaliTyping && (
                <NepaliTypingGuide />
              )}
            </>
          )}

          <div className="progress-track">
            <div className="progress-track-header">
              <span>Your progress</span>
              <span>
                {answeredCount} of {totalQuestions} answered
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>

          {groupQuestionsByType(assessment.questions).map((group, groupIndex) => (
            <div className="question-group" key={group.type}>
              <div className="question-meta-row">
                <h3 className="section-heading">
                  <span className="section-letter">{SECTION_LETTERS[groupIndex] ?? '•'}.</span>{' '}
                  {QUESTION_TYPE_INSTRUCTIONS[group.type] ?? 'Answer the following questions.'}
                </h3>
                <span className="question-points-chip">
                  {group.totalPoints} {group.totalPoints === 1 ? 'mark' : 'marks'}
                </span>
              </div>

              {group.type === 'fill_in_blank' ? (
                <div className="fill-blank-set">
                  <ol className="fill-blank-list">
                    {group.items.map((question) => {
                      const blankParts = question.prompt.split(/_{3,}/)
                      const blankValues = answers[question.id] ?? []
                      return (
                        <li className="fill-blank-item" key={question.id}>
                          {blankParts.map((part, partIndex) => (
                            <span key={partIndex}>
                              <MarkdownText text={part} />
                              {partIndex < blankParts.length - 1 && (
                                <input
                                  type="text"
                                  className="fill-blank-input"
                                  value={blankValues[partIndex] ?? ''}
                                  onChange={(e) =>
                                    setAnswers((prev) => {
                                      const values = [...(prev[question.id] ?? [])]
                                      values[partIndex] = nextTypedValueForQuestion(question, e.target.value)
                                      return { ...prev, [question.id]: values }
                                    })
                                  }
                                  onBlur={(e) =>
                                    setAnswers((prev) => {
                                      const values = [...(prev[question.id] ?? [])]
                                      values[partIndex] = finalizeTypedValueForQuestion(
                                        question,
                                        e.target.value
                                      )
                                      return { ...prev, [question.id]: values }
                                    })
                                  }
                                />
                              )}
                            </span>
                          ))}
                        </li>
                      )
                    })}
                  </ol>

                  {fillInBlankWordBank.length > 0 && (
                    <div className="word-bank">
                      <span className="word-bank-label">Word bank</span>
                      <div className="word-bank-list">
                        {fillInBlankWordBank.map((word, wordIndex) => (
                          <span className="word-bank-chip" key={wordIndex}>
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : group.type === 'written_response' ? (
                group.items.map((question, itemIndex) => (
                  <WrittenResponseInput
                    key={question.id}
                    question={question}
                    index={itemIndex}
                    value={answers[question.id] ?? ''}
                    onChange={(value) =>
                      setAnswers((prev) => ({ ...prev, [question.id]: nextTypedValueForQuestion(question, value) }))
                    }
                    onBlur={(value) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: finalizeTypedValueForQuestion(question, value),
                      }))
                    }
                  />
                ))
              ) : (
                group.items.map((question, itemIndex) => (
                  <div className="question-block" key={question.id}>
                    <p className="question-prompt">
                      <span className="question-number">{itemIndex + 1}</span>
                      <MarkdownText text={question.prompt} />
                    </p>

                    {question.type === 'multiple_choice' || question.type === 'true_false' ? (
                      <div className="option-list">
                        {question.options?.map((option) => {
                          const isSelected = answers[question.id] === option.key
                          return (
                            <label
                              className={`option-item${isSelected ? ' selected' : ''}`}
                              key={option.key}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option.key}
                                checked={isSelected}
                                onChange={() =>
                                  setAnswers((prev) => ({ ...prev, [question.id]: option.key }))
                                }
                              />
                              <span className="option-marker" />
                              {option.label}
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={answers[question.id] ?? ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: nextTypedValueForQuestion(question, e.target.value),
                          }))
                        }
                        onBlur={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: finalizeTypedValueForQuestion(question, e.target.value),
                          }))
                        }
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          ))}

          <button type="submit" className="auth-submit submit-big" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit answers'}
          </button>
        </form>
      ) : (
        <div className="assessment-overview">
          {(assessment.passage || assessment.prompt) && (
            <MarkdownText as="p" className="assessment-passage" text={assessment.passage || assessment.prompt} />
          )}

          {(result || assessment.latest_attempt) && (
            <ResultCard result={result ?? assessment.latest_attempt} questions={assessment.questions} />
          )}

          {attemptsExhausted ? (
            <p className="attempts-exhausted">You've used all your attempts for this assessment.</p>
          ) : (
            <button type="button" className="start-button" onClick={handleStart}>
              <PlayIcon />
              {assessment.attempts_used > 0 ? 'Practice More' : 'Start Practice'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function WrittenResponseInput({ question, index, value, onChange, onBlur }) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className="question-block">
      <p className="question-prompt">
        <span className="question-number">{index + 1}</span>
        <MarkdownText text={question.prompt} />
      </p>
      <textarea
        className="essay-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        rows={6}
        placeholder="Start writing here..."
        required
      />
      <div className="word-count-row">
        <span className="word-count-chip">
          {wordCount} word{wordCount === 1 ? '' : 's'}
        </span>
        {(question.min_word_count || question.max_word_count) && (
          <span className="word-count-hint">
            {question.min_word_count ? `min ${question.min_word_count}` : ''}
            {question.min_word_count && question.max_word_count ? ' · ' : ''}
            {question.max_word_count ? `max ${question.max_word_count}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// Resolves a stored response into what a student should actually read:
// multiple_choice/true_false store an option key ('a', 'true'), so this
// looks up the matching option's label; fill_in_blank stores each blank's
// answer joined by ';', shown one per blank; everything else is plain text.
function describeResponse(question, rawValue) {
  if (!rawValue) return '(left blank)'

  if (question.type === 'fill_in_blank') {
    return rawValue
      .split(';')
      .map((part) => (part.trim() ? part.trim() : '(blank)'))
      .join(', ')
  }

  if (question.options) {
    const match = question.options.find((option) => option.key === rawValue)
    return match ? match.label : rawValue
  }

  return rawValue
}

// fill_in_blank's correct_answer already arrives as a readable ", "-joined
// string from the backend (one accepted spelling per blank); multiple_choice/
// true_false store the option key, so resolve it to that option's label.
function describeCorrectAnswer(question) {
  if (question.correct_answer == null) return null
  if (question.type === 'fill_in_blank') return question.correct_answer

  if (question.options) {
    const match = question.options.find((option) => option.key === question.correct_answer)
    return match ? match.label : question.correct_answer
  }

  return question.correct_answer
}

function ResultCard({ result, questions }) {
  if (!result) return null

  if (result.status !== 'graded') {
    return (
      <div className="result-pending">
        <span className="result-pending-icon">⏳</span>
        <div>
          <p className="result-pending-title">Submitted!</p>
          <p className="result-pending-text">Your teacher will grade this soon.</p>
        </div>
      </div>
    )
  }

  const maxScore = Number(result.max_score) || 0
  const percentage = maxScore > 0 ? Math.round((Number(result.score) / maxScore) * 100) : 0
  const tier = scoreTier(percentage)
  const questionsById = new Map((questions ?? []).map((question) => [question.id, question]))

  return (
    <div className={`result-card result-card-${tier.tone}`}>
      <div className="result-card-top">
        <div className={`score-ring score-ring-${tier.tone}`} style={{ '--pct': percentage }}>
          <div className="score-ring-inner">
            <span className="score-ring-value">{percentage}%</span>
          </div>
        </div>
        <div>
          <p className="result-headline">
            {tier.emoji} {tier.message}
          </p>
          <p className="result-score">
            Score: {result.score}/{result.max_score}
          </p>
        </div>
      </div>

      {result.feedback && <p className="result-feedback">"{result.feedback}"</p>}

      {result.answers && (
        <ul className="result-answers">
          {result.answers.map((answer, index) => {
            const question = questionsById.get(answer.question_id)
            if (!question) return null

            if (question.type === 'written_response') {
              return (
                <li key={answer.id ?? index} className="answer-written">
                  <span className={`answer-badge${answer.points_awarded == null ? ' answer-pending' : ''}`}>
                    {answer.points_awarded != null ? `${answer.points_awarded}/${question.points} pts` : 'Awaiting grading'}
                  </span>
                  <p className="question-prompt">
                    <MarkdownText text={question.prompt} />
                  </p>
                  <p className="answer-essay-response">{answer.response_text || '(left blank)'}</p>
                  {answer.feedback && <p className="result-feedback">"{answer.feedback}"</p>}
                </li>
              )
            }

            const correctAnswerLabel = describeCorrectAnswer(question)

            return (
              <li key={answer.id ?? index} className={answer.is_correct ? 'answer-correct' : 'answer-incorrect'}>
                <span className="answer-badge">{answer.is_correct ? 'Correct' : 'Incorrect'}</span>
                <p className="question-prompt">
                  <MarkdownText text={question.prompt} />
                </p>
                <span>Your answer: {describeResponse(question, answer.response_text)}</span>
                {!answer.is_correct && correctAnswerLabel && (
                  <span className="result-correct-answer">Correct answer: {correctAnswerLabel}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

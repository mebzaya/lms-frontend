import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchSubjectExam, startSubjectExamAttempt, submitSubjectExamAttempt } from '../api/student'
import { PlayIcon, ReadingIcon, WritingIcon } from '../components/icons'
import MarkdownText from '../components/MarkdownText'
import NepaliTypingGuide from '../components/NepaliTypingGuide'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { formatNepaliDateTime } from '../utils/nepaliDateTime'
import { applyNepaliBoundaryConversion, finalizeNepaliText } from '../utils/nepaliTransliteration'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './AssessmentAttempt.css'
import './SubjectExamAttempt.css'

const NEPALI_TYPING_STORAGE_KEY = 'lms_nepali_typing'

const QUESTION_TYPE_INSTRUCTIONS = {
  multiple_choice: 'Solve the multiple choice questions.',
  true_false: 'Decide whether each statement is true or false.',
  short_answer: 'Answer the following questions.',
  fill_in_blank: 'Fill in the blanks.',
  written_response: 'Write your response to each of the following.',
}

const WINDOW_STATUS_LABEL = {
  scheduled: 'Not open yet',
  live: 'Open now',
  ended: 'Closed',
}

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

export default function SubjectExamAttempt() {
  const { examId } = useParams()
  const [exam, setExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [isTaking, setIsTaking] = useState(false)

  const [answers, setAnswers] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function nextTypedValueForQuestion(question, rawValue) {
    return nepaliTyping && question.answer_language === 'nepali'
      ? applyNepaliBoundaryConversion(rawValue)
      : rawValue
  }

  function finalizeTypedValueForQuestion(question, rawValue) {
    const value =
      nepaliTyping && question.answer_language === 'nepali' ? finalizeNepaliText(rawValue) : rawValue
    return value.trim()
  }

  useEffectDeduped(() => {
    load()
  }, [examId])

  useEffectDeduped(() => {
    if (!exam?.sections) return
    const expectsNepali = exam.sections.some((section) =>
      section.questions.some(
        (q) => q.type !== 'multiple_choice' && q.type !== 'true_false' && q.answer_language === 'nepali'
      )
    )
    if (expectsNepali) setNepaliTyping(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchSubjectExam(examId)
      setExam(data)
      setIsTaking(data.attempt?.status === 'in_progress')
    } catch {
      setError('Could not load this exam right now.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStart() {
    setError('')
    setIsStarting(true)
    try {
      await startSubjectExamAttempt(examId)
      setAnswers({})
      await load()
      setIsTaking(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not start this exam.')
    } finally {
      setIsStarting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        sections: exam.sections.map((section) => ({
          section_id: section.id,
          answers: section.questions.map((question) => {
            const value = answers[question.id]
            const responseText = Array.isArray(value)
              ? value.map((part) => finalizeTypedValueForQuestion(question, part ?? '')).join(';')
              : finalizeTypedValueForQuestion(question, value ?? '')
            return { question_id: question.id, response_text: responseText }
          }),
        })),
      }

      await submitSubjectExamAttempt(exam.attempt.id, payload)
      setIsTaking(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not submit your exam.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillInBlankWordBanksBySection = useMemo(() => {
    if (!exam?.sections) return {}
    const banks = {}
    exam.sections.forEach((section) => {
      const hints = section.questions
        .filter((question) => question.type === 'fill_in_blank' && question.answer_hint)
        .map((question) => question.answer_hint)
      banks[section.id] = shuffledCopy(hints)
    })
    return banks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id])

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!exam) {
    return <p className="student-status auth-error">{error || 'Exam not found.'}</p>
  }

  const hasNepaliContent =
    exam.sections?.some((section) =>
      section.questions.some(
        (q) => q.type !== 'multiple_choice' && q.type !== 'true_false' && q.answer_language === 'nepali'
      )
    ) ?? false

  const totalQuestions = exam.sections?.reduce((sum, s) => sum + s.questions.length, 0) ?? 0
  const answeredCount = Object.keys(answers).length

  return (
    <div className="assessment-attempt">
      <Link to="/dashboard/exams" className="back-link">
        &larr; Back to exams
      </Link>

      <section className="assessment-hero assessment-hero-reading exam-hero">
        <div className="assessment-hero-text">
          <div className="assessment-title-row">
            <h1>{exam.title}</h1>
            <span className="mode-badge mode-badge-exam">Exam</span>
            {hasNepaliContent && <span className="mode-badge language-badge">नेपाली</span>}
          </div>
          <p className="assessment-hero-subtitle">
            {exam.subject?.name} — an official exam covering the whole subject.
          </p>
          <span className="attempts-pill">
            {WINDOW_STATUS_LABEL[exam.window_status]}
            {exam.starts_at && exam.window_status !== 'ended' && (
              <> · {formatNepaliDateTime(exam.starts_at)} &rarr; {formatNepaliDateTime(exam.ends_at)}</>
            )}
          </span>
        </div>
      </section>

      {exam.instructions && (
        <MarkdownText as="p" className="assessment-instructions" text={exam.instructions} />
      )}

      {error && <p className="auth-error">{error}</p>}

      {isTaking ? (
        <form onSubmit={handleSubmit} className="assessment-form">
          {hasNepaliContent && (
            <>
              <button
                type="button"
                className={`nepali-toggle${nepaliTyping ? ' active' : ''}`}
                onClick={toggleNepaliTyping}
              >
                {nepaliTyping ? '✓ नेपाली टाइपिङ चालु छ' : 'Type in Nepali (नेपाली)'}
              </button>
              {nepaliTyping && <NepaliTypingGuide />}
            </>
          )}

          {totalQuestions > 0 && (
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
          )}

          {exam.sections.map((section, sectionIndex) => (
            <div className="exam-section-block" key={section.id}>
              <div className="exam-section-header">
                <span className="exam-section-icon">
                  {section.type === 'writing' ? <WritingIcon /> : <ReadingIcon />}
                </span>
                <h2 className="exam-section-title">
                  Section {sectionIndex + 1}: {section.title}
                </h2>
              </div>
              {section.instructions && <MarkdownText as="p" className="exam-section-instructions" text={section.instructions} />}

              {(section.passage || section.prompt) && (
                <MarkdownText as="p" className="assessment-passage" text={section.passage || section.prompt} />
              )}

              {groupQuestionsByType(section.questions).map((group) => (
                <div className="question-group" key={group.type}>
                  <div className="question-meta-row">
                    <h3 className="section-heading">
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

                      {(fillInBlankWordBanksBySection[section.id] ?? []).length > 0 && (
                        <div className="word-bank">
                          <span className="word-bank-label">Word bank</span>
                          <div className="word-bank-list">
                            {fillInBlankWordBanksBySection[section.id].map((word, wordIndex) => (
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
            </div>
          ))}

          <button type="submit" className="auth-submit submit-big" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit exam'}
          </button>
        </form>
      ) : (
        <div className="assessment-overview">
          {exam.attempt && <ExamResultCard exam={exam} />}

          {!exam.attempt && exam.window_status === 'live' && (
            <button type="button" className="start-button" onClick={handleStart} disabled={isStarting}>
              <PlayIcon />
              {isStarting ? 'Starting...' : 'Start Exam'}
            </button>
          )}

          {!exam.attempt && exam.window_status === 'scheduled' && (
            <p className="attempts-exhausted">
              This exam opens at {formatNepaliDateTime(exam.starts_at)}.
            </p>
          )}

          {!exam.attempt && exam.window_status === 'ended' && (
            <p className="attempts-exhausted">This exam's window has closed. You did not attempt it.</p>
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

function describeCorrectAnswer(question) {
  if (question.correct_answer == null) return null

  // fill_in_blank's correct_answer already arrives as a readable ", "-joined
  // string from the backend (one accepted spelling per blank).
  if (question.type === 'fill_in_blank') return question.correct_answer

  if (question.options) {
    const match = question.options.find((option) => option.key === question.correct_answer)
    return match ? match.label : question.correct_answer
  }

  return question.correct_answer
}

function ExamResultCard({ exam }) {
  const { attempt, sections } = exam

  const allQuestions = (sections ?? []).flatMap((section) => section.questions ?? [])
  const allAnswers = (sections ?? []).flatMap((section) => section.answers ?? [])
  const autoGradedQuestionIds = new Set(
    allQuestions.filter((q) => q.type !== 'written_response').map((q) => q.id)
  )
  const autoGradedEarned = allAnswers
    .filter((a) => autoGradedQuestionIds.has(a.question_id))
    .reduce((sum, a) => sum + Number(a.points_awarded ?? 0), 0)
  const autoGradedPossible = allQuestions
    .filter((q) => q.type !== 'written_response')
    .reduce((sum, q) => sum + Number(q.points ?? 0), 0)

  const isFullyGraded = attempt.status === 'graded'
  const maxScore = Number(attempt.max_score) || 0
  const percentage = isFullyGraded && maxScore > 0 ? Math.round((Number(attempt.score) / maxScore) * 100) : 0
  const tier = scoreTier(percentage)

  return (
    <div className={`result-card${isFullyGraded ? ` result-card-${tier.tone}` : ''}`}>
      {isFullyGraded ? (
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
              Final score: {attempt.score}/{attempt.max_score}
            </p>
          </div>
        </div>
      ) : (
        <div className="result-pending">
          <span className="result-pending-icon">⏳</span>
          <div>
            <p className="result-pending-title">Submitted — auto-graded questions are scored, written answers await your teacher.</p>
            {autoGradedPossible > 0 && (
              <p className="result-pending-text">
                Score so far: {autoGradedEarned}/{autoGradedPossible}. Your final score will include the written
                answers once graded.
              </p>
            )}
          </div>
        </div>
      )}

      {sections?.map((section, sectionIndex) => (
        <div className="exam-result-section" key={section.id}>
          <p className="exam-result-section-title">
            Section {sectionIndex + 1}: {section.title}
          </p>

          <ul className="result-answers exam-result-questions">
            {section.questions.map((question, questionIndex) => {
              const answer = section.answers?.find((a) => a.question_id === question.id)
              if (!answer) return null

              if (question.type === 'written_response') {
                return (
                  <li key={question.id} className="exam-result-question">
                    <div className="exam-result-question-top">
                      {answer.points_awarded != null ? (
                        <span className="exam-result-question-points">
                          {answer.points_awarded}/{question.points} pts
                        </span>
                      ) : (
                        <span className="answer-badge answer-pending">Awaiting grading</span>
                      )}
                    </div>
                    <p className="exam-result-question-prompt">
                      <span className="question-number">{questionIndex + 1}</span>
                      <MarkdownText text={question.prompt} />
                    </p>
                    <p className="exam-result-essay-response">{answer.response_text || '(left blank)'}</p>
                    {answer.feedback && <p className="result-feedback">"{answer.feedback}"</p>}
                  </li>
                )
              }

              const correctAnswerLabel = describeCorrectAnswer(question)

              return (
                <li
                  key={question.id}
                  className={`exam-result-question ${answer.is_correct ? 'answer-correct' : 'answer-incorrect'}`}
                >
                  <div className="exam-result-question-top">
                    <span className="answer-badge">{answer.is_correct ? 'Correct' : 'Incorrect'}</span>
                    <span className="exam-result-question-points">
                      {Number(answer.points_awarded ?? 0)}/{question.points} pts
                    </span>
                  </div>
                  <p className="exam-result-question-prompt">
                    <span className="question-number">{questionIndex + 1}</span>
                    <MarkdownText text={question.prompt} />
                  </p>
                  <p className="exam-result-answer-line">
                    Your answer: <strong>{describeResponse(question, answer.response_text)}</strong>
                  </p>
                  {!answer.is_correct && correctAnswerLabel && (
                    <p className="exam-result-answer-line exam-result-correct-line">
                      Correct answer: <strong>{correctAnswerLabel}</strong>
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

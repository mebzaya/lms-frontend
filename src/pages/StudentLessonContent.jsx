import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchLessonContent } from '../api/student'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import './LessonContent.css'

export default function StudentLessonContent() {
  const { lessonId } = useParams()
  const location = useLocation()
  const [lesson, setLesson] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    setIsLoading(true)
    setError('')
    fetchLessonContent(lessonId)
      .then(setLesson)
      .catch(() => setError('This lesson isn’t available to read right now.'))
      .finally(() => setIsLoading(false))
  }, [lessonId])

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!lesson) {
    return <p className="student-status auth-error">{error}</p>
  }

  // lesson.subject.id always works (even after a refresh, where any state
  // passed on the way in is gone); location.state's subjectName just avoids
  // a redundant re-fetch flash of the subject list's own name lookup.
  const subjectId = location.state?.subjectId ?? lesson.subject?.id
  const backTo = subjectId ? `/dashboard/subjects/${subjectId}/lessons` : '/dashboard'
  const backState = { subjectName: location.state?.subjectName ?? lesson.subject?.name }

  return (
    <div className="lesson-content-page lesson-content-page-read">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to {lesson.subject?.name ?? 'lessons'}
      </Link>

      <article className="lesson-textbook">
        <p className="lesson-textbook-subject">{lesson.subject?.name}</p>
        <h1>{lesson.title}</h1>
        <div className="lesson-content-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  )
}

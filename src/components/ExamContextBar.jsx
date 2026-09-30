import { ClassesIcon, ExamIcon, LessonsIcon, SubjectsIcon } from './icons'
import './ExamContextBar.css'

// A small row of badges under a form page's title, so a teacher adding or
// editing a section/question always knows which subject, class, term (and
// optionally section) they're working in — without that having to be
// crammed awkwardly into the heading itself.
export default function ExamContextBar({ subjectName, className, examTitle, sectionTitle }) {
  if (!subjectName && !className && !examTitle && !sectionTitle) return null

  return (
    <div className="exam-context-bar">
      {subjectName && (
        <span className="exam-context-item">
          <SubjectsIcon />
          {subjectName}
        </span>
      )}
      {className && (
        <span className="exam-context-item">
          <ClassesIcon />
          {className}
        </span>
      )}
      {examTitle && (
        <span className="exam-context-item">
          <ExamIcon />
          {examTitle}
        </span>
      )}
      {sectionTitle && (
        <span className="exam-context-item">
          <LessonsIcon />
          {sectionTitle}
        </span>
      )}
    </div>
  )
}

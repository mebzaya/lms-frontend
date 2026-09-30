import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchChildClassResults, fetchChildExamResult, fetchChildScores } from '../api/parent'
import ReportCard from '../components/ReportCard'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './ParentChildScores.css'

export default function ParentChildScores() {
  const { childId } = useParams()

  return (
    <div className="child-scores">
      <Link to="/dashboard" className="back-link">
        &larr; Back to children
      </Link>

      <ChildResultsPanel childId={childId} />
    </div>
  )
}

// The exam-results section — shared by this per-child detail page and the
// "Results" sidebar menu (ParentResults.jsx), which renders this directly
// when a parent has only one linked child.
export function ChildResultsPanel({ childId }) {
  const [childName, setChildName] = useState(null)
  const [classResults, setClassResults] = useState(null)
  const [reportCards, setReportCards] = useState({})
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchChildScores(childId)
      .then((data) => setChildName(data.child.name))
      .catch(() => setError('Could not load this child’s scores right now.'))
  }, [childId])

  useEffectDeduped(() => {
    fetchChildClassResults(childId)
      .then(setClassResults)
      .catch(() => setError('Could not load this child’s scores right now.'))
  }, [childId])

  // One report card per published exam, same per-subject breakdown a
  // student sees of their own results.
  useEffectDeduped(() => {
    if (!classResults) return
    classResults.forEach((exam) => {
      fetchChildExamResult(childId, exam.id)
        .then((result) => setReportCards((prev) => ({ ...prev, [exam.id]: result.subjects })))
        .catch(() => {})
    })
  }, [classResults, childId])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!classResults || childName === null) {
    return <p className="student-status">Loading...</p>
  }

  return (
    <>
      <h1>{childName}'s results</h1>

      {classResults.length === 0 ? (
        <p className="student-status">No results have been published yet.</p>
      ) : (
        <div className="report-card-list">
          {classResults.map((exam) =>
            reportCards[exam.id] ? (
              <div className="report-card-list-item" key={exam.id}>
                <ReportCard
                  studentName={childName}
                  examTitle={exam.title}
                  rank={exam.your_rank}
                  subjects={reportCards[exam.id]}
                />
              </div>
            ) : (
              <p className="student-status" key={exam.id}>
                Loading {exam.title}...
              </p>
            )
          )}
        </div>
      )}
    </>
  )
}

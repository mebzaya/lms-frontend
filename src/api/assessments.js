import apiClient from './client'

export function fetchTeacherAssessments(lessonId) {
  return apiClient.get('/teacher/assessments', { params: { lesson_id: lessonId } }).then((res) => res.data.assessments)
}

export function createAssessment(data) {
  return apiClient.post('/teacher/assessments', data).then((res) => res.data.assessment)
}

export function updateAssessment(id, data) {
  return apiClient.put(`/teacher/assessments/${id}`, data).then((res) => res.data.assessment)
}

export function deleteAssessment(id) {
  return apiClient.delete(`/teacher/assessments/${id}`).then((res) => res.data)
}

export function createQuestion(assessmentId, data) {
  return apiClient.post(`/teacher/assessments/${assessmentId}/questions`, data).then((res) => res.data.question)
}

export function updateQuestion(id, data) {
  return apiClient.put(`/teacher/questions/${id}`, data).then((res) => res.data.question)
}

export function deleteQuestion(id) {
  return apiClient.delete(`/teacher/questions/${id}`).then((res) => res.data)
}

export function fetchGradingQueue() {
  return apiClient.get('/teacher/grading').then((res) => res.data.answers)
}

export function gradeAssessmentAnswer(answerId, data) {
  return apiClient.post(`/teacher/assessment-answers/${answerId}/grade`, data).then((res) => res.data.answer)
}

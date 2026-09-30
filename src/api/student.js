import apiClient from './client'

export function fetchStudentDashboard() {
  return apiClient.get('/student/dashboard').then((res) => res.data)
}

export function fetchAssessment(assessmentId) {
  return apiClient.get(`/student/assessments/${assessmentId}`).then((res) => res.data.assessment)
}

export function fetchLessonContent(lessonId) {
  return apiClient.get(`/student/lessons/${lessonId}`).then((res) => res.data.lesson)
}

export function startAttempt(assessmentId) {
  return apiClient.post(`/student/assessments/${assessmentId}/attempts`).then((res) => res.data.attempt)
}

export function submitAttempt(attemptId, payload) {
  return apiClient.post(`/student/attempts/${attemptId}/submit`, payload).then((res) => res.data.attempt)
}

export function fetchSubjectExams() {
  return apiClient.get('/student/subject-exams').then((res) => res.data.exams)
}

export function fetchSubjectExam(examId) {
  return apiClient.get(`/student/subject-exams/${examId}`).then((res) => res.data.exam)
}

export function startSubjectExamAttempt(examId) {
  return apiClient.post(`/student/subject-exams/${examId}/attempts`).then((res) => res.data.attempt)
}

export function submitSubjectExamAttempt(attemptId, payload) {
  return apiClient.post(`/student/subject-exam-attempts/${attemptId}/submit`, payload).then((res) => res.data.attempt)
}

export function fetchStudentResults() {
  return apiClient.get('/student/results').then((res) => res.data)
}

export function fetchPublishedClassResults() {
  return apiClient.get('/student/class-results').then((res) => res.data.exams)
}

export function fetchExamRanking(examId) {
  return apiClient.get(`/student/exams/${examId}/results`).then((res) => res.data)
}

export function fetchExamStudentResult(examId, studentId) {
  return apiClient.get(`/student/exams/${examId}/results/${studentId}`).then((res) => res.data)
}

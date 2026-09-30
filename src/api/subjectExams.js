import apiClient from './client'

export function fetchTeacherSubjectExams(subjectId) {
  return apiClient.get('/teacher/subject-exams', { params: { subject_id: subjectId } }).then((res) => res.data.exams)
}

export function submitSubjectExam(examId) {
  return apiClient.post(`/teacher/subject-exams/${examId}/submit`).then((res) => res.data.exam)
}

export function unsubmitSubjectExam(examId) {
  return apiClient.post(`/teacher/subject-exams/${examId}/unsubmit`).then((res) => res.data.exam)
}

export function createExamSection(examId, data) {
  return apiClient.post(`/teacher/subject-exams/${examId}/sections`, data).then((res) => res.data.section)
}

export function updateExamSection(sectionId, data) {
  return apiClient.put(`/teacher/subject-exam-sections/${sectionId}`, data).then((res) => res.data.section)
}

export function deleteExamSection(sectionId) {
  return apiClient.delete(`/teacher/subject-exam-sections/${sectionId}`).then((res) => res.data)
}

export function createExamQuestion(sectionId, data) {
  return apiClient
    .post(`/teacher/subject-exam-sections/${sectionId}/questions`, data)
    .then((res) => res.data.question)
}

export function updateExamQuestion(questionId, data) {
  return apiClient.put(`/teacher/subject-exam-questions/${questionId}`, data).then((res) => res.data.question)
}

export function deleteExamQuestion(questionId) {
  return apiClient.delete(`/teacher/subject-exam-questions/${questionId}`).then((res) => res.data)
}

export function fetchSubjectExamGradingQueue() {
  return apiClient.get('/teacher/subject-exam-grading').then((res) => res.data.answers)
}

export function gradeSubjectExamAnswer(answerId, data) {
  return apiClient.post(`/teacher/subject-exam-answers/${answerId}/grade`, data).then((res) => res.data.answer)
}

export function fetchTeacherExamRanking(examId) {
  return apiClient.get(`/teacher/exams/${examId}/results`).then((res) => res.data)
}

export function fetchTeacherExamStudentResult(examId, studentId) {
  return apiClient.get(`/teacher/exams/${examId}/results/${studentId}`).then((res) => res.data)
}

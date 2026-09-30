import apiClient from './client'

// Every exam across every class, or just one class's when classId is given.
export function fetchAdminExams(classId) {
  return apiClient.get('/admin/exams', { params: classId ? { class_id: classId } : {} }).then((res) => res.data.exams)
}

export function fetchAdminExam(id) {
  return apiClient.get(`/admin/exams/${id}`).then((res) => res.data.exam)
}

export function createAdminExam(data) {
  return apiClient.post('/admin/exams', data).then((res) => res.data.exam)
}

export function updateAdminExam(id, data) {
  return apiClient.put(`/admin/exams/${id}`, data).then((res) => res.data.exam)
}

export function deleteAdminExam(id) {
  return apiClient.delete(`/admin/exams/${id}`).then((res) => res.data)
}

export function publishAdminExam(id, data) {
  return apiClient.post(`/admin/exams/${id}/publish`, data).then((res) => res.data.exam)
}

export function unpublishAdminExam(id) {
  return apiClient.post(`/admin/exams/${id}/unpublish`).then((res) => res.data.exam)
}

export function fetchAdminSubjectExam(subjectExamId) {
  return apiClient.get(`/admin/subject-exams/${subjectExamId}`).then((res) => res.data.subject_exam)
}

export function publishExamResults(id) {
  return apiClient.post(`/admin/exams/${id}/publish-results`).then((res) => res.data.exam)
}

export function unpublishExamResults(id) {
  return apiClient.post(`/admin/exams/${id}/unpublish-results`).then((res) => res.data.exam)
}

export function fetchAdminExamRanking(examId) {
  return apiClient.get(`/admin/exams/${examId}/results`).then((res) => res.data)
}

export function fetchAdminExamStudentResult(examId, studentId) {
  return apiClient.get(`/admin/exams/${examId}/results/${studentId}`).then((res) => res.data)
}

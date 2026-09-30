import apiClient from './client'

export function fetchParentDashboard() {
  return apiClient.get('/parent/dashboard').then((res) => res.data.children)
}

export function fetchChildScores(childId) {
  return apiClient.get(`/parent/children/${childId}/scores`).then((res) => res.data)
}

export function fetchChildClassResults(childId) {
  return apiClient.get(`/parent/children/${childId}/class-results`).then((res) => res.data.exams)
}

export function fetchChildExamResult(childId, examId) {
  return apiClient.get(`/parent/children/${childId}/exams/${examId}/results`).then((res) => res.data)
}

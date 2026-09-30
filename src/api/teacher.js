import apiClient from './client'

export function fetchTeacherDashboard() {
  return apiClient.get('/teacher/dashboard').then((res) => res.data)
}

export function createLesson(data) {
  return apiClient.post('/teacher/lessons', data).then((res) => res.data.lesson)
}

export function startLesson(lessonId) {
  return apiClient.post(`/teacher/lessons/${lessonId}/start`).then((res) => res.data.lesson)
}

export function endLesson(lessonId) {
  return apiClient.post(`/teacher/lessons/${lessonId}/end`).then((res) => res.data.lesson)
}

export function fetchLesson(lessonId) {
  return apiClient.get(`/teacher/lessons/${lessonId}`).then((res) => res.data.lesson)
}

export function updateLesson(lessonId, data) {
  return apiClient.put(`/teacher/lessons/${lessonId}`, data).then((res) => res.data.lesson)
}

export function saveLessonContent(lessonId, content) {
  return apiClient.put(`/teacher/lessons/${lessonId}/content`, { content }).then((res) => res.data.lesson)
}

export function releaseLessonContent(lessonId) {
  return apiClient.post(`/teacher/lessons/${lessonId}/release-content`).then((res) => res.data.lesson)
}

export function unreleaseLessonContent(lessonId) {
  return apiClient.post(`/teacher/lessons/${lessonId}/unrelease-content`).then((res) => res.data.lesson)
}

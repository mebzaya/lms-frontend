import apiClient from './client'

export function fetchClasses() {
  return apiClient.get('/admin/classes').then((res) => res.data.classes)
}

export function createClass(data) {
  return apiClient.post('/admin/classes', data).then((res) => res.data.class)
}

export function updateClass(id, data) {
  return apiClient.put(`/admin/classes/${id}`, data).then((res) => res.data.class)
}

export function deleteClass(id) {
  return apiClient.delete(`/admin/classes/${id}`).then((res) => res.data)
}

export function fetchSubjects(params = {}) {
  return apiClient.get('/admin/subjects', { params }).then((res) => res.data.subjects)
}

export function createSubject(data) {
  return apiClient.post('/admin/subjects', data).then((res) => res.data.subject)
}

export function updateSubject(id, data) {
  return apiClient.put(`/admin/subjects/${id}`, data).then((res) => res.data.subject)
}

export function deleteSubject(id) {
  return apiClient.delete(`/admin/subjects/${id}`).then((res) => res.data)
}

export function syncSubjectTeachers(subjectId, teacherIds) {
  return apiClient
    .put(`/admin/subjects/${subjectId}/teachers`, { teacher_ids: teacherIds })
    .then((res) => res.data.subject)
}

export function fetchLessons(params = {}) {
  return apiClient.get('/admin/lessons', { params }).then((res) => res.data.lessons)
}

export function createLesson(data) {
  return apiClient.post('/admin/lessons', data).then((res) => res.data.lesson)
}

export function updateLesson(id, data) {
  return apiClient.put(`/admin/lessons/${id}`, data).then((res) => res.data.lesson)
}

export function deleteLesson(id) {
  return apiClient.delete(`/admin/lessons/${id}`).then((res) => res.data)
}

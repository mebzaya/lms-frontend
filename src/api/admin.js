import apiClient from './client'

export function fetchStats() {
  return apiClient.get('/admin/stats').then((res) => res.data.stats)
}

export function fetchUsers(params = {}) {
  return apiClient.get('/admin/users', { params }).then((res) => res.data.users)
}

export function createUser(data) {
  return apiClient.post('/admin/users', data).then((res) => res.data.user)
}

export function updateUser(id, data) {
  return apiClient.put(`/admin/users/${id}`, data).then((res) => res.data.user)
}

export function deleteUser(id) {
  return apiClient.delete(`/admin/users/${id}`).then((res) => res.data)
}

export function syncStudentParents(studentId, parentIds) {
  return apiClient
    .put(`/admin/users/${studentId}/parents`, { parent_ids: parentIds })
    .then((res) => res.data.user)
}

export function syncTeacherSubjects(teacherId, subjectIds) {
  return apiClient
    .put(`/admin/users/${teacherId}/subjects`, { subject_ids: subjectIds })
    .then((res) => res.data.user)
}

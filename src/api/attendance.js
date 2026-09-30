import apiClient from './client'

// Teacher — mark and view attendance for classes they teach.
export function fetchAttendanceClasses() {
  return apiClient.get('/teacher/attendance/classes').then((res) => res.data.classes)
}

export function fetchAttendanceRoster(classId, date) {
  return apiClient.get('/teacher/attendance', { params: { class_id: classId, date } }).then((res) => res.data)
}

export function saveAttendance(classId, date, records) {
  return apiClient.post('/teacher/attendance', { class_id: classId, date, records }).then((res) => res.data)
}

export function fetchAttendanceSummary(classId) {
  return apiClient.get('/teacher/attendance/summary', { params: { class_id: classId } }).then((res) => res.data)
}

export function fetchAttendanceDates(classId) {
  return apiClient.get('/teacher/attendance/dates', { params: { class_id: classId } }).then((res) => res.data.dates)
}

// Admin — read-only oversight of any class.
export function fetchAdminAttendanceRoster(classId, date) {
  return apiClient.get('/admin/attendance', { params: { class_id: classId, date } }).then((res) => res.data)
}

export function fetchAdminAttendanceSummary(classId) {
  return apiClient.get('/admin/attendance/summary', { params: { class_id: classId } }).then((res) => res.data)
}

export function fetchAdminAttendanceDates(classId) {
  return apiClient.get('/admin/attendance/dates', { params: { class_id: classId } }).then((res) => res.data.dates)
}

// Student — own attendance.
export function fetchMyAttendance() {
  return apiClient.get('/student/attendance').then((res) => res.data)
}

// Parent — a linked child's attendance.
export function fetchChildAttendance(childId) {
  return apiClient.get(`/parent/children/${childId}/attendance`).then((res) => res.data)
}

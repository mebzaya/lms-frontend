import apiClient from './client'

export function login(email, password) {
  return apiClient.post('/auth/login', { email, password }).then((res) => res.data)
}

export function fetchCurrentUser() {
  return apiClient.get('/auth/me').then((res) => res.data.user)
}

export function logout() {
  return apiClient.post('/auth/logout').then((res) => res.data)
}

export function updateProfile(name) {
  return apiClient.put('/auth/profile', { name }).then((res) => res.data.user)
}

export function changePassword(currentPassword, password, passwordConfirmation) {
  return apiClient
    .put('/auth/password', {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    })
    .then((res) => res.data)
}

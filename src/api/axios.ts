import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://8080/api', // ajuste para a URL real
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

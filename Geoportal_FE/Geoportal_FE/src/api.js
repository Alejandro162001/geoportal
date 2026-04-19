import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptores opcionales (por ejemplo para JWT en el futuro)
api.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user && user.token) {
    // config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

export default api

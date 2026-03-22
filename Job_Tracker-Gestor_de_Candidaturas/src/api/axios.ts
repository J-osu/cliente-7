import axios from 'axios';

const api = axios.create({
  baseURL: 'https://jobs-api.free.beeceptor.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
import axios from './axios';

export function checkConnection() {
  return axios.get('/up');
}
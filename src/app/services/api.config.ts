const apiHost = window.location.hostname === 'localhost'
  ? 'localhost'
  : '192.168.1.165';

export const API_URL = `http://${apiHost}:3000/api`;
const estaEmDesenvolvimento = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_URL = estaEmDesenvolvimento
	? 'http://localhost:3000/api'
	: 'https://inkstation-backend.onrender.com/api';
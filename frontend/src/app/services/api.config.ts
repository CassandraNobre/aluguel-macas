const estaEmDesenvolvimento = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Alterado para usar o caminho relativo /api, assim funciona em qualquer lugar
export const API_URL = estaEmDesenvolvimento
	? 'http://localhost:3000/api'
	: '/api';
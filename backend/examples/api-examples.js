/**
 * InkStation API - JavaScript/Fetch Examples
 * 
 * This file contains example fetch() calls for consuming the InkStation API
 * Use these as templates for your Angular, React, or vanilla JS frontend
 */

// =============================================
// API CONFIGURATION
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken') || null;

/**
 * Helper function to make API requests
 * Automatically includes authorization header and error handling
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add authorization token if available
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        // Handle errors
        if (!response.ok) {
            console.error('API Error:', data);
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('Request Error:', error);
        throw error;
    }
}

/**
 * Store auth token in localStorage
 */
function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('authToken', token);
}

/**
 * Remove auth token from localStorage
 */
function removeAuthToken() {
    authToken = null;
    localStorage.removeItem('authToken');
}

// =============================================
// AUTHENTICATION ENDPOINTS
// =============================================

/**
 * Register new user
 * POST /api/auth/register
 */
async function registerUser(nome_artistico, email, senha, confirmar_senha) {
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                nome_artistico,
                email,
                senha,
                confirmar_senha
            })
        });

        if (response.data && response.data.id) {
            // Auto-login after registration
            console.log('User registered:', response.data);
            return response.data;
        }
    } catch (error) {
        console.error('Registration failed:', error.message);
        throw error;
    }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function loginUser(email, senha) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });

        if (response.data && response.data.token) {
            setAuthToken(response.data.token);
            console.log('Login successful:', response.data.user);
            return response.data;
        }
    } catch (error) {
        console.error('Login failed:', error.message);
        throw error;
    }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
async function getCurrentUser() {
    try {
        const response = await apiRequest('/auth/me', {
            method: 'GET'
        });

        return response.data;
    } catch (error) {
        console.error('Failed to get current user:', error.message);
        removeAuthToken(); // Clear invalid token
        throw error;
    }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
async function logoutUser() {
    try {
        await apiRequest('/auth/logout', {
            method: 'POST'
        });

        removeAuthToken();
        console.log('Logout successful');
    } catch (error) {
        console.error('Logout failed:', error.message);
        removeAuthToken(); // Clear token anyway
        throw error;
    }
}

/**
 * Google OAuth login (prepare for implementation)
 * POST /api/auth/google
 */
async function loginWithGoogle(googleToken) {
    try {
        const response = await apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ google_token: googleToken })
        });

        if (response.data && response.data.token) {
            setAuthToken(response.data.token);
            return response.data;
        }
    } catch (error) {
        console.error('Google login failed:', error.message);
        throw error;
    }
}

// =============================================
// ESTACOES (WORKSTATIONS) ENDPOINTS
// =============================================

/**
 * Get all available workstations
 * GET /api/estacoes
 */
async function getAllWorkstations() {
    try {
        const response = await apiRequest('/estacoes', {
            method: 'GET'
        });

        return response.data;
    } catch (error) {
        console.error('Failed to fetch workstations:', error.message);
        throw error;
    }
}

/**
 * Get single workstation details
 * GET /api/estacoes/{id}
 */
async function getWorkstationById(id) {
    try {
        const response = await apiRequest(`/estacoes/${id}`, {
            method: 'GET'
        });

        return response.data;
    } catch (error) {
        console.error(`Failed to fetch workstation ${id}:`, error.message);
        throw error;
    }
}

/**
 * Get workstation availability for a specific date
 * GET /api/estacoes/{id}/disponibilidade?data=YYYY-MM-DD
 */
async function getWorkstationAvailability(id, data) {
    try {
        const response = await apiRequest(`/estacoes/${id}/disponibilidade?data=${data}`, {
            method: 'GET'
        });

        return response.data;
    } catch (error) {
        console.error(`Failed to fetch availability for workstation ${id}:`, error.message);
        throw error;
    }
}

// =============================================
// RESERVAS (RESERVATIONS) ENDPOINTS
// =============================================

/**
 * Get all reservations for current user
 * GET /api/reservas
 */
async function getUserReservations() {
    try {
        const response = await apiRequest('/reservas', {
            method: 'GET'
        });

        return response.data;
    } catch (error) {
        console.error('Failed to fetch reservations:', error.message);
        throw error;
    }
}

/**
 * Get single reservation details
 * GET /api/reservas/{id}
 */
async function getReservationById(id) {
    try {
        const response = await apiRequest(`/reservas/${id}`, {
            method: 'GET'
        });

        return response.data;
    } catch (error) {
        console.error(`Failed to fetch reservation ${id}:`, error.message);
        throw error;
    }
}

/**
 * Create new reservation
 * POST /api/reservas
 */
async function createReservation(estacao_id, data, horario_inicio, horario_fim, observacoes = '') {
    try {
        const response = await apiRequest('/reservas', {
            method: 'POST',
            body: JSON.stringify({
                estacao_id,
                data,
                horario_inicio,
                horario_fim,
                observacoes
            })
        });

        console.log('Reservation created:', response.data);
        return response.data;
    } catch (error) {
        if (error.message.includes('409')) {
            console.error('Schedule conflict - time slot already booked');
        }
        console.error('Failed to create reservation:', error.message);
        throw error;
    }
}

/**
 * Cancel reservation
 * PATCH /api/reservas/{id}/cancelar
 */
async function cancelReservation(id) {
    try {
        const response = await apiRequest(`/reservas/${id}/cancelar`, {
            method: 'PATCH'
        });

        console.log('Reservation cancelled:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to cancel reservation:', error.message);
        throw error;
    }
}

// =============================================
// PRACTICAL USAGE EXAMPLES
// =============================================

/**
 * Example 1: Register and login flow
 */
async function exampleRegisterAndLogin() {
    try {
        console.log('=== Registration Example ===');
        await registerUser(
            'Artista Silva',
            'artista@example.com',
            'senha123456',
            'senha123456'
        );

        console.log('=== Login Example ===');
        const loginResponse = await loginUser(
            'artista@example.com',
            'senha123456'
        );

        console.log('Logged in user:', loginResponse.user);
    } catch (error) {
        console.error('Example failed:', error);
    }
}

/**
 * Example 2: Browse workstations and check availability
 */
async function exampleBrowseAndCheckAvailability() {
    try {
        console.log('=== Get All Workstations ===');
        const workstations = await getAllWorkstations();
        console.log('Available workstations:', workstations);

        if (workstations.length > 0) {
            const estacaoId = workstations[0].id;
            
            console.log('=== Check Availability for Date ===');
            const availability = await getWorkstationAvailability(
                estacaoId,
                '2026-08-25'
            );
            console.log('Available time slots:', availability.horarios_disponiveis);
        }
    } catch (error) {
        console.error('Example failed:', error);
    }
}

/**
 * Example 3: Create and manage reservations
 */
async function exampleCreateAndManageReservation() {
    try {
        // First ensure user is logged in
        if (!authToken) {
            await loginUser('artista@example.com', 'senha123456');
        }

        console.log('=== Create Reservation ===');
        const newReservation = await createReservation(
            1,                    // estacao_id
            '2026-08-25',        // data
            '09:00',             // horario_inicio
            '13:00',             // horario_fim
            'Sessão de realismo' // observacoes
        );
        console.log('Created reservation:', newReservation);

        const reservationId = newReservation.id;

        console.log('=== Get User Reservations ===');
        const reservations = await getUserReservations();
        console.log('User reservations:', reservations);

        console.log('=== Get Specific Reservation ===');
        const reservation = await getReservationById(reservationId);
        console.log('Reservation details:', reservation);

        console.log('=== Cancel Reservation ===');
        const cancelled = await cancelReservation(reservationId);
        console.log('Cancelled reservation:', cancelled);
    } catch (error) {
        console.error('Example failed:', error);
    }
}

/**
 * Example 4: Full booking flow
 */
async function exampleFullBookingFlow() {
    try {
        // Step 1: Login
        console.log('Step 1: Logging in...');
        await loginUser('artista@example.com', 'senha123456');

        // Step 2: Get all workstations
        console.log('Step 2: Getting workstations...');
        const workstations = await getAllWorkstations();
        const selectedStation = workstations[0];

        // Step 3: Check availability
        console.log('Step 3: Checking availability...');
        const availability = await getWorkstationAvailability(
            selectedStation.id,
            '2026-08-25'
        );
        console.log('Available slots:', availability.horarios_disponiveis);

        // Step 4: Create reservation
        console.log('Step 4: Creating reservation...');
        const reservation = await createReservation(
            selectedStation.id,
            '2026-08-25',
            '09:00',
            '13:00',
            'Sessão de realismo'
        );
        console.log('Reservation confirmed:', reservation);

        // Step 5: View current reservations
        console.log('Step 5: Viewing all reservations...');
        const myReservations = await getUserReservations();
        console.log('My reservations:', myReservations);

        // Step 6: Logout
        console.log('Step 6: Logging out...');
        await logoutUser();
        console.log('Logged out successfully');

    } catch (error) {
        console.error('Booking flow failed:', error);
    }
}

// =============================================
// ERROR HANDLING EXAMPLE
// =============================================

/**
 * Handle different error types
 */
async function exampleErrorHandling() {
    try {
        // This will fail - user not authenticated
        await getUserReservations();
    } catch (error) {
        if (error.message.includes('401')) {
            console.error('Not authenticated - redirect to login');
        } else if (error.message.includes('409')) {
            console.error('Conflict - time slot already booked');
        } else if (error.message.includes('400')) {
            console.error('Invalid input - check your data');
        } else if (error.message.includes('500')) {
            console.error('Server error - try again later');
        } else {
            console.error('Unknown error:', error);
        }
    }
}

// =============================================
// EXPORT FOR USE IN OTHER MODULES
// =============================================

// If using ES6 modules, uncomment these exports:
/*
export {
    apiRequest,
    setAuthToken,
    removeAuthToken,
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    loginWithGoogle,
    getAllWorkstations,
    getWorkstationById,
    getWorkstationAvailability,
    getUserReservations,
    getReservationById,
    createReservation,
    cancelReservation
};
*/

// For use in browser console or other script contexts:
// window.InkStationAPI = { ... all functions above ... };

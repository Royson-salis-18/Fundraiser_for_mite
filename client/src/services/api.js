// Use environment variable for API URL
// In production (combined deployment), API is on same domain, so use relative path
// In development or separate deployment, use full URL
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Auth API
export const authAPI = {
  login: async (email, password, role) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};

// Events API
export const eventsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/events`);
    return response.json();
  },

  getOne: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}`);
    return response.json();
  },

  create: async (eventData) => {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(eventData),
    });
    return response.json();
  },

  update: async (id, eventData) => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(eventData),
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },
};

// Registrations API
export const registrationsAPI = {
  create: async (registrationData) => {
    const response = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(registrationData),
    });
    return response.json();
  },

  getUserRegistrations: async () => {
    const response = await fetch(`${API_URL}/registrations`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  getAllRegistrations: async () => {
    const response = await fetch(`${API_URL}/admin/registrations`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  updateProfile: async (userData) => {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  updatePayments: async (payments) => {
    const response = await fetch(`${API_URL}/user/payments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ payments }),
    });
    return response.json();
  },

  getPayments: async () => {
    const response = await fetch(`${API_URL}/user/payments`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_URL}/user/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.json();
  },
};

// Admin API - Payment Statistics
export const adminAPI = {
  // Get all payment statistics
  getPaymentStats: async () => {
    const response = await fetch(`${API_URL}/admin/payment-stats`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  // Get students who paid for a specific event
  getEventPayments: async (eventId) => {
    const response = await fetch(`${API_URL}/admin/event-payments/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  // Get all students with their payment status
  getAllStudentsPayments: async () => {
    const response = await fetch(`${API_URL}/admin/students-payments`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  // Get payment summary (counts, totals, etc.)
  getPaymentSummary: async () => {
    const response = await fetch(`${API_URL}/admin/payment-summary`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  // Get all pending payments for admin review
  getPendingPayments: async () => {
    const response = await fetch(`${API_URL}/admin/pending-payments`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    
    // Check if response is OK and is JSON
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        return { error: errorJson.error || 'Failed to load pending payments' };
      } catch {
        return { error: `Server error: ${response.status} ${response.statusText}` };
      }
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      return { error: 'Server returned invalid response format' };
    }
    
    return response.json();
  },

  // Confirm or reject a payment
  confirmPayment: async (studentId, paymentId, status, eventType) => {
    const response = await fetch(`${API_URL}/admin/confirm-payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ studentId, paymentId, status, eventType }),
    });
    return response.json();
  },
};
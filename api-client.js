// SoleMar API Client
class SoleMarAPI {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  // Generic fetch wrapper with error handling
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // ===== ROOMS API =====
  async getRooms(type = null) {
    const params = type ? `?type=${type}` : '';
    return this.request(`/api/rooms${params}`);
  }

  async getRoom(id) {
    return this.request(`/api/rooms/${id}`);
  }

  // ===== BOOKINGS API =====
  async getBookings(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const query = params ? `?${params}` : '';
    return this.request(`/api/bookings${query}`);
  }

  async createBooking(bookingData) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async updateBooking(id, updates) {
    return this.request(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteBooking(id) {
    return this.request(`/api/bookings/${id}`, {
      method: 'DELETE'
    });
  }

  // ===== AVAILABILITY API =====
  async checkAvailability(roomId, checkinDate, checkoutDate) {
    return this.request('/api/availability/check', {
      method: 'POST',
      body: JSON.stringify({
        room_id: roomId,
        checkin_date: checkinDate,
        checkout_date: checkoutDate
      })
    });
  }

  async getAvailability(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const query = params ? `?${params}` : '';
    return this.request(`/api/availability${query}`);
  }

  // ===== PAYMENTS API =====
  async createPayment(paymentData) {
    return this.request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  // ===== REVIEWS API =====
  async getReviews(verifiedOnly = false) {
    const params = verifiedOnly ? '?verified_only=true' : '';
    return this.request(`/api/reviews${params}`);
  }

  async createReview(reviewData) {
    return this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  // ===== FAQ API =====
  async getFAQ(category = null) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/api/faq${params}`);
  }

  // ===== AUTHENTICATION API =====
  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  // ===== DASHBOARD API =====
  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
  }

  // ===== UTILITY METHODS =====
  async checkHealth() {
    return this.request('/api/health');
  }

  // Error handling helper
  handleError(error) {
    console.error('API Error:', error);
    // In production, show user-friendly error messages
    alert('An error occurred while communicating with the server. Please try again.');
  }

  // Retry mechanism for failed requests
  async retryRequest(endpoint, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
}

// Create global API instance
const api = new SoleMarAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoleMarAPI;
}

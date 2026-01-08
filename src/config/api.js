// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  
  // Home Content
  HOME_CONTENT: '/api/admin/home-content',
  
  // Media Items
  MEDIA_ITEMS: '/api/admin/media-items',
  
  // Pricing
  PRICING: '/api/admin/pricing',
  
  // Testimonials
  TESTIMONIALS: '/api/admin/testimonials',
  
  // Affiliates
  AFFILIATES: '/api/admin/affiliates'
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
};

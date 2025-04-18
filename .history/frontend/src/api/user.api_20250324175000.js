import api from '../services/api.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE_URL = `${API_URL}/users`;

const userApi = {
  // Get all users with pagination
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`${BASE_URL}?page=${page}&limit=${limit}`);
    // Normalize response to always return users and pagination
    if (response.data?.users) {
      return response.data;
    }
    return { users: [], pagination: { total: 0, page, limit, pages: 0 } };
  },
  
  // Get a single user by ID
  getById: (id) => api.get(`${BASE_URL}/${id}`),
  
  // Create a new user
  create: (userData) => api.post(BASE_URL, userData),
  
  // Update a user
  update: (id, userData) => api.put(`${BASE_URL}/${id}`, userData),
  
  // Delete a user
  delete: (id) => api.delete(`${BASE_URL}/${id}`)
};

export default userApi;
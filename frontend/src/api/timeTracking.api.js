// frontend/src/api/timeTracking.api.js
import api from '../services/api.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE_URL = `${API_URL}/time-tracking`;

const timeTrackingApi = {
  // Settings
  getSettings: () => api.get(`${BASE_URL}/settings`),
  updateSettings: (settings) => api.put(`${BASE_URL}/settings`, settings),
  
  // Sessions
  startSession: (data = {}) => api.post(`${BASE_URL}/sessions/start`, data),
  endSession: (data = {}) => api.post(`${BASE_URL}/sessions/end`, data),
  getCurrentSession: () => api.get(`${BASE_URL}/sessions/current`),
  getAllActiveSessions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    
    const queryString = params.toString();
    return api.get(`${BASE_URL}/sessions/active/all${queryString ? `?${queryString}` : ''}`);
  },
  getUserSessions: (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.status) params.append('status', filters.status);
    return api.get(`${BASE_URL}/sessions?${params.toString()}`);
  },
  getUserSessionsById: (userId, page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.status) params.append('status', filters.status);
    return api.get(`${BASE_URL}/sessions/user/${userId}?${params.toString()}`);
  },
  updateSessionNotes: (sessionId, notes) => 
    api.put(`${BASE_URL}/sessions/${sessionId}/notes`, { notes }),

  // Breaks
  startBreak: () => api.post(`${BASE_URL}/breaks/start`),
  endBreak: () => api.post(`${BASE_URL}/breaks/end`),
  
  // Reports and calendar
  getDailySummaries: (year, month, userId = null) => {
    const params = new URLSearchParams({ year, month });
    if (userId) params.append('userId', userId);
    return api.get(`${BASE_URL}/daily-summaries?${params.toString()}`);
  },
  
  getReport: (userIds, startDate, endDate) => {
    return api.post(`${BASE_URL}/report`, { userIds, startDate, endDate });
  }
};

export default timeTrackingApi;
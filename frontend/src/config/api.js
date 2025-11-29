const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH_TELEGRAM: `${API_BASE_URL}/auth/telegram`,
  
  // Profile
  GET_PROFILE: (userId) => `${API_BASE_URL}/profile/${userId}`,
  SAVE_BASELINE: (userId) => `${API_BASE_URL}/profile/${userId}/baseline`,
  SAVE_DEPENDENCY: (userId) => `${API_BASE_URL}/profile/${userId}/dependency`,
  SAVE_MAIN_GOAL: (userId) => `${API_BASE_URL}/profile/${userId}/main-goal`,
  GET_STATS: (userId) => `${API_BASE_URL}/profile/${userId}/stats`,
  
  // Daily Report
  SAVE_DAILY_REPORT: `${API_BASE_URL}/daily-report`,
  GET_DAILY_REPORT: (userId, date) => `${API_BASE_URL}/daily-report/${userId}/${date}`,
  GET_LATEST_REPORT: (userId) => `${API_BASE_URL}/daily-report/${userId}/latest`,
  CHECK_TODAY: (userId) => `${API_BASE_URL}/daily-report/${userId}/check-today`
};

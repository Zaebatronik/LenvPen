import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

class ApiClient {
  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Auth
  async authenticateTelegram(initData) {
    const response = await this.client.post(API_ENDPOINTS.AUTH_TELEGRAM, { initData });
    return response.data;
  }

  // Profile
  async getProfile(userId) {
    const response = await this.client.get(API_ENDPOINTS.GET_PROFILE(userId));
    return response.data;
  }

  async saveBaseline(userId, data) {
    const response = await this.client.post(API_ENDPOINTS.SAVE_BASELINE(userId), data);
    return response.data;
  }

  async saveDependency(userId, dependencyData) {
    const response = await this.client.post(API_ENDPOINTS.SAVE_DEPENDENCY(userId), dependencyData);
    return response.data;
  }

  async saveMainGoal(userId, goalData) {
    const response = await this.client.post(API_ENDPOINTS.SAVE_MAIN_GOAL(userId), goalData);
    return response.data;
  }

  async getStats(userId) {
    const response = await this.client.get(API_ENDPOINTS.GET_STATS(userId));
    return response.data;
  }

  // Daily Reports
  async saveDailyReport(reportData) {
    const response = await this.client.post(API_ENDPOINTS.SAVE_DAILY_REPORT, reportData);
    return response.data;
  }

  async getDailyReport(userId, date) {
    const response = await this.client.get(API_ENDPOINTS.GET_DAILY_REPORT(userId, date));
    return response.data;
  }

  async getLatestReport(userId) {
    const response = await this.client.get(API_ENDPOINTS.GET_LATEST_REPORT(userId));
    return response.data;
  }

  async checkTodayReport(userId) {
    const response = await this.client.get(API_ENDPOINTS.CHECK_TODAY(userId));
    return response.data;
  }
}

export const apiClient = new ApiClient();

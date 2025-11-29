import { create } from 'zustand';

export const useStore = create((set) => ({
  // User data
  user: null,
  profile: null,
  dependencies: [],
  mainGoal: null,
  overallVictory: 0,
  
  // Survey state
  surveyData: {
    status: null,
    position: '',
    selectedDependencies: [],
    dependencyDetails: {},
    baseline: {},
    mainGoalText: ''
  },
  
  // Actions
  setUser: (user) => set({ user }),
  updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
  setProfile: (profile) => set({ profile }),
  setDependencies: (dependencies) => set({ dependencies }),
  setMainGoal: (mainGoal) => set({ mainGoal }),
  setOverallVictory: (percent) => set({ overallVictory: percent }),
  
  updateSurveyData: (data) => set((state) => ({
    surveyData: { ...state.surveyData, ...data }
  })),
  
  resetSurveyData: () => set({
    surveyData: {
      status: null,
      position: '',
      selectedDependencies: [],
      dependencyDetails: {},
      baseline: {},
      mainGoalText: ''
    }
  }),
  
  // Load full profile
  loadProfile: async (userId, apiClient) => {
    try {
      const data = await apiClient.getProfile(userId);
      set({
        profile: data.profile,
        dependencies: data.dependencies,
        mainGoal: data.main_goal,
        overallVictory: data.profile?.overall_victory_percent || 0
      });
    } catch (error) {
      console.error('Load profile error:', error);
    }
  }
}));

import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

/**
 * GET /api/profile/:userId
 * Получить полный профиль пользователя
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Получаем базовый профиль
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Получаем dependency_cards
    const { data: dependencies, error: depsError } = await supabase
      .from('dependency_cards')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false });

    if (depsError) throw depsError;

    // Получаем главную цель
    const { data: mainGoal, error: goalError } = await supabase
      .from('main_goal')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (goalError && goalError.code !== 'PGRST116') {
      throw goalError;
    }

    // Получаем последние отчёты (7 дней)
    const { data: recentReports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7);

    if (reportsError) throw reportsError;

    res.json({
      profile: profile || null,
      dependencies: dependencies || [],
      main_goal: mainGoal || null,
      recent_reports: recentReports || []
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', details: error.message });
  }
});

/**
 * POST /api/profile/:userId/baseline
 * Сохранить baseline данные (анкета)
 */
router.post('/:userId/baseline', async (req, res) => {
  try {
    const { userId } = req.params;
    const { country, city, nickname, status, position, baseline } = req.body;

    // Проверяем, есть ли профиль
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let profile;

    if (existingProfile) {
      // Обновляем
      const { data, error } = await supabase
        .from('profiles')
        .update({
          country,
          city,
          nickname,
          status,
          position,
          baseline
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      profile = data;
    } else {
      // Создаём
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          country,
          city,
          nickname,
          status,
          position,
          baseline
        })
        .select()
        .single();

      if (error) throw error;
      profile = data;
    }

    res.json({ success: true, profile });

  } catch (error) {
    console.error('Save baseline error:', error);
    res.status(500).json({ error: 'Failed to save baseline', details: error.message });
  }
});

/**
 * POST /api/profile/:userId/dependency
 * Создать или обновить dependency_card
 */
router.post('/:userId/dependency', async (req, res) => {
  try {
    const { userId } = req.params;
    const { key, meta, priority } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Dependency key is required' });
    }

    // Проверяем, существует ли уже
    const { data: existing } = await supabase
      .from('dependency_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .single();

    let dependency;

    if (existing) {
      // Обновляем
      const { data, error } = await supabase
        .from('dependency_cards')
        .update({ meta, priority })
        .eq('user_id', userId)
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;
      dependency = data;
    } else {
      // Создаём
      const { data, error } = await supabase
        .from('dependency_cards')
        .insert({
          user_id: userId,
          key,
          meta,
          priority: priority || 5,
          percent: 0,
          streak: 0,
          history: []
        })
        .select()
        .single();

      if (error) throw error;
      dependency = data;
    }

    res.json({ success: true, dependency });

  } catch (error) {
    console.error('Save dependency error:', error);
    res.status(500).json({ error: 'Failed to save dependency', details: error.message });
  }
});

/**
 * POST /api/profile/:userId/main-goal
 * Сохранить главную цель
 */
router.post('/:userId/main-goal', async (req, res) => {
  try {
    const { userId } = req.params;
    const { text, category } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Goal text is required' });
    }

    // Проверяем, есть ли уже цель
    const { data: existing } = await supabase
      .from('main_goal')
      .select('*')
      .eq('user_id', userId)
      .single();

    let goal;

    if (existing) {
      // Обновляем
      const { data, error } = await supabase
        .from('main_goal')
        .update({ text, category: category || 'life_goal' })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      goal = data;
    } else {
      // Создаём
      const { data, error } = await supabase
        .from('main_goal')
        .insert({
          user_id: userId,
          text,
          category: category || 'life_goal',
          progress_estimates: {}
        })
        .select()
        .single();

      if (error) throw error;
      goal = data;
    }

    res.json({ success: true, goal });

  } catch (error) {
    console.error('Save main goal error:', error);
    res.status(500).json({ error: 'Failed to save main goal', details: error.message });
  }
});

/**
 * GET /api/profile/:userId/stats
 * Получить статистику и историю
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    // Получаем все dependency_cards с историей
    const { data: dependencies, error: depsError } = await supabase
      .from('dependency_cards')
      .select('*')
      .eq('user_id', userId);

    if (depsError) throw depsError;

    // Получаем все отчёты
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (reportsError) throw reportsError;

    // Вычисляем общую победу
    let overallVictory = 0;
    if (dependencies && dependencies.length > 0) {
      const sum = dependencies.reduce((acc, dep) => acc + parseFloat(dep.percent), 0);
      overallVictory = Math.round(sum / dependencies.length);
    }

    res.json({
      overall_victory_percent: overallVictory,
      dependencies,
      reports,
      total_reports: reports.length
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', details: error.message });
  }
});

export default router;

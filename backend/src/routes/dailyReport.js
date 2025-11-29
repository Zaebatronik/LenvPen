import express from 'express';
import { supabase } from '../index.js';
import { 
  updateDependencyPercents, 
  updateMainGoalProgress 
} from '../services/percentCalculator.js';

const router = express.Router();

/**
 * POST /api/daily-report
 * Создать/обновить дневной отчёт
 * Body: { userId, date, for_goal, dependencies_daily, mood }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, date, for_goal, dependencies_daily, mood } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }

    // Проверяем, есть ли уже отчёт за эту дату
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    let report;

    if (existingReport) {
      // Обновляем существующий
      const { data, error } = await supabase
        .from('daily_reports')
        .update({
          for_goal: for_goal || {},
          dependencies_daily: dependencies_daily || {},
          mood: mood || {}
        })
        .eq('user_id', userId)
        .eq('date', date)
        .select()
        .single();

      if (error) throw error;
      report = data;
    } else {
      // Создаём новый
      const { data, error } = await supabase
        .from('daily_reports')
        .insert({
          user_id: userId,
          date,
          for_goal: for_goal || {},
          dependencies_daily: dependencies_daily || {},
          mood: mood || {}
        })
        .select()
        .single();

      if (error) throw error;
      report = data;
    }

    // Обновляем проценты зависимостей
    const updateResult = await updateDependencyPercents(
      userId, 
      date, 
      dependencies_daily || {}
    );

    // Обновляем прогресс главной цели (если есть оценка)
    if (for_goal && for_goal.rating !== undefined) {
      await updateMainGoalProgress(userId, date, for_goal.rating);
    }

    res.json({
      success: true,
      report,
      updates: updateResult.updates
    });

  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to save daily report', details: error.message });
  }
});

/**
 * GET /api/daily-report/:userId/:date
 * Получить отчёт за конкретную дату
 */
router.get('/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;

    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ report: report || null });

  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({ error: 'Failed to get daily report', details: error.message });
  }
});

/**
 * GET /api/daily-report/:userId/latest
 * Получить последний отчёт
 */
router.get('/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ report: report || null });

  } catch (error) {
    console.error('Get latest report error:', error);
    res.status(500).json({ error: 'Failed to get latest report', details: error.message });
  }
});

/**
 * GET /api/daily-report/:userId/check-today
 * Проверить, заполнен ли отчёт сегодня
 */
router.get('/:userId/check-today', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ 
      has_report_today: !!report,
      report: report || null,
      date: today
    });

  } catch (error) {
    console.error('Check today report error:', error);
    res.status(500).json({ error: 'Failed to check today report', details: error.message });
  }
});

export default router;

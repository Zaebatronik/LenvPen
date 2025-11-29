const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { processDailyReport } = require('../workers/dailyReportWorker');

/**
 * POST /api/profile/me/daily_report
 * 
 * Submit daily report with dependency values
 * Request body:
 * {
 *   goal_progress: number (0-10),
 *   mood: number (0-10),
 *   stress: number (0-10),
 *   sleep_hours: number,
 *   comment: string,
 *   dependencies: [
 *     {
 *       user_dependency_id: uuid,
 *       value: object (varies by type),
 *       slip: boolean
 *     }
 *   ]
 * }
 */
router.post('/me/daily_report', async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const {
      goal_progress,
      mood,
      stress,
      sleep_hours,
      comment,
      dependencies
    } = req.body;
    
    // Validation
    if (goal_progress == null || mood == null || stress == null || sleep_hours == null) {
      return res.status(400).json({
        error: 'Missing required fields: goal_progress, mood, stress, sleep_hours'
      });
    }
    
    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      return res.status(400).json({
        error: 'dependencies array is required and must not be empty'
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if report for today already exists
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    
    if (existingReport) {
      return res.status(400).json({
        error: 'Daily report already submitted for today',
        reportId: existingReport.id
      });
    }
    
    // 1. Insert daily_reports
    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .insert({
        user_id: userId,
        date: today,
        goal_progress,
        mood,
        stress,
        sleep_hours,
        comment: comment || null
      })
      .select()
      .single();
    
    if (reportError) {
      console.error('Error inserting daily_reports:', reportError);
      return res.status(500).json({ error: 'Failed to create report' });
    }
    
    console.log(`Created daily report: ${report.id}`);
    
    // 2. Insert daily_dependency_reports
    const depReportsToInsert = dependencies.map(dep => ({
      daily_report_id: report.id,
      user_dependency_id: dep.user_dependency_id,
      value: dep.value,
      slip: dep.slip || false,
      is_win: false,
      is_partial_win: false
    }));
    
    const { error: depError } = await supabase
      .from('daily_dependency_reports')
      .insert(depReportsToInsert);
    
    if (depError) {
      console.error('Error inserting daily_dependency_reports:', depError);
      // Rollback: delete the report
      await supabase.from('daily_reports').delete().eq('id', report.id);
      return res.status(500).json({ error: 'Failed to create dependency reports' });
    }
    
    console.log(`Inserted ${depReportsToInsert.length} dependency reports`);
    
    // 3. Trigger worker to process report asynchronously
    // For MVP, we'll process synchronously
    // TODO: Use Bull queue for production
    try {
      const result = await processDailyReport(report.id);
      console.log('Worker result:', result);
    } catch (workerError) {
      console.error('Worker error:', workerError);
      // Don't fail the request - report was saved, processing can be retried
    }
    
    return res.status(201).json({
      success: true,
      reportId: report.id,
      message: 'Daily report submitted successfully'
    });
    
  } catch (error) {
    console.error('Error in POST /me/daily_report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profile/me/metrics
 * 
 * Get current metrics and recent history
 * Query params:
 *   days: number (default 30) - how many days of history to return
 */
router.get('/me/metrics', async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    
    // 1. Get current system metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('system_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (metricsError && metricsError.code !== 'PGRST116') {
      console.error('Error fetching system_metrics:', metricsError);
      return res.status(500).json({ error: 'Failed to fetch metrics' });
    }
    
    // 2. Get user dependencies
    const { data: dependencies, error: depError } = await supabase
      .from('user_dependencies')
      .select(`
        id,
        dependency_id,
        base_harm,
        base_difficulty,
        base_frequency,
        base_weight,
        current_weight,
        percent,
        streak,
        last_slip_at,
        dependencies (
          key,
          title,
          emoji,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (depError) {
      console.error('Error fetching user_dependencies:', depError);
      return res.status(500).json({ error: 'Failed to fetch dependencies' });
    }
    
    // 3. Get daily metrics history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const { data: history, error: historyError } = await supabase
      .from('daily_metrics_history')
      .select('*')
      .eq('user_id', userId)
      .gte('date', cutoffDateStr)
      .order('date', { ascending: true });
    
    if (historyError) {
      console.error('Error fetching daily_metrics_history:', historyError);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    
    // 4. Calculate avatar stage (0-100 → 5 stages)
    const disciplineHealth = metrics?.discipline_health || 50;
    let avatarStage = 1;
    if (disciplineHealth >= 80) avatarStage = 5;
    else if (disciplineHealth >= 60) avatarStage = 4;
    else if (disciplineHealth >= 40) avatarStage = 3;
    else if (disciplineHealth >= 20) avatarStage = 2;
    
    return res.json({
      metrics: {
        discipline_health: disciplineHealth,
        total_xp: metrics?.total_xp || 0,
        last_report_date: metrics?.last_report_date || null,
        avatar_stage: avatarStage
      },
      dependencies: dependencies.map(d => ({
        id: d.id,
        key: d.dependencies.key,
        title: d.dependencies.title,
        emoji: d.dependencies.emoji,
        percent: d.percent,
        current_weight: d.current_weight,
        streak: d.streak,
        last_slip_at: d.last_slip_at
      })),
      history: history || []
    });
    
  } catch (error) {
    console.error('Error in GET /me/metrics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profile/me/daily_report
 * 
 * Check if today's report exists
 */
router.get('/me/daily_report', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('id, date, goal_progress, mood, stress, sleep_hours')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching daily_reports:', error);
      return res.status(500).json({ error: 'Failed to check report' });
    }
    
    return res.json({
      exists: !!report,
      report: report || null
    });
    
  } catch (error) {
    console.error('Error in GET /me/daily_report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

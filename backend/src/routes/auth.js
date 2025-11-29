import express from 'express';
import { supabase } from '../index.js';
import { 
  verifyTelegramWebAppData, 
  parseTelegramInitData, 
  isAuthDateValid 
} from '../utils/telegram.js';

const router = express.Router();

/**
 * POST /api/auth/telegram
 * Авторизация через Telegram WebApp
 * Body: { initData: string }
 */
router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }

    // Проверяем подпись
    const isValid = verifyTelegramWebAppData(
      initData, 
      process.env.TELEGRAM_BOT_TOKEN
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Telegram signature' });
    }

    // Парсим данные пользователя
    const userData = parseTelegramInitData(initData);

    // Проверяем актуальность auth_date
    if (!isAuthDateValid(userData.auth_date)) {
      return res.status(401).json({ error: 'Auth data expired' });
    }

    // Проверяем, существует ли пользователь (используем maybeSingle для избежания ошибки)
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userData.id)
      .maybeSingle();

    // Игнорируем ошибку PGRST116 (no rows returned)
    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    let user;

    if (existingUser) {
      // Пользователь существует - обновляем информацию и last_login
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url
        })
        .eq('telegram_id', userData.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
      
      console.log(`✅ User logged in: ${userData.username} (${userData.id})`);
    } else {
      // Новый пользователь - создаём запись
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: userData.id,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
          is_guest: false
        })
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
      
      console.log(`🎉 New user registered: ${userData.username} (${userData.id})`);
    }

    // Проверяем, есть ли профиль
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url
      },
      has_profile: !!profile,
      profile: profile || null
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

export default router;

export const DEPENDENCIES = {
  smoking: {
    key: 'smoking',
    icon: '🚬',
    title: 'Курение'
  },
  alcohol: {
    key: 'alcohol',
    icon: '🍺',
    title: 'Алкоголь'
  },
  phone: {
    key: 'phone',
    icon: '📱',
    title: 'Телефон / Соцсети'
  },
  games: {
    key: 'games',
    icon: '🎮',
    title: 'Игромания'
  },
  overeating: {
    key: 'overeating',
    icon: '🍔',
    title: 'Переедание'
  },
  sweet: {
    key: 'sweet',
    icon: '🍰',
    title: 'Сладкое'
  },
  gambling: {
    key: 'gambling',
    icon: '🎰',
    title: 'Ставки / Азарт'
  },
  porn: {
    key: 'porn',
    icon: '🔞',
    title: 'Порно'
  },
  late_sleep: {
    key: 'late_sleep',
    icon: '🌙',
    title: 'Засиживаюсь по ночам'
  },
  drugs: {
    key: 'drugs',
    icon: '💉',
    title: 'Что-то покрепче'
  },
  procrastination: {
    key: 'procrastination',
    icon: '🛋️',
    title: 'Прокрастинация'
  },
  other: {
    key: 'other',
    icon: '❓',
    title: 'Другое'
  }
};

export const USER_STATUSES = [
  { value: 'full_time', label: 'Работаю на полной ставке' },
  { value: 'remote', label: 'Работаю удалённо' },
  { value: 'student', label: 'Учусь' },
  { value: 'part_time', label: 'Подрабатываю / неполная занятость' },
  { value: 'unemployed', label: 'Не работаю' },
  { value: 'other', label: 'Другое' }
];

export const PHONE_TIME_OPTIONS = [
  { value: '0-2', label: 'До 2 часов' },
  { value: '2-4', label: '2–4 часа' },
  { value: '4-6', label: '4–6 часов' },
  { value: '6+', label: 'Более 6 часов' }
];

export const ACTIVITY_OPTIONS = [
  { value: 'none', label: 'Нет' },
  { value: '1x', label: '1× в неделю' },
  { value: '2-3x', label: '2–3× в неделю' },
  { value: '4+x', label: '4+ в неделю' }
];

export const STRESS_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'very_high', label: 'Очень высокий' }
];

export const SLEEP_OPTIONS = [
  { value: 'good', label: 'Хорошее' },
  { value: 'medium', label: 'Среднее' },
  { value: 'bad', label: 'Плохое' }
];

export const WATER_OPTIONS = [
  { value: '<1', label: 'Меньше 1 литра' },
  { value: '1-1.5', label: '1–1.5 литра' },
  { value: '1.5-2', label: '1.5–2 литра' },
  { value: '2+', label: 'Больше 2 литров' }
];

export const AIR_OPTIONS = [
  { value: 'daily', label: 'Каждый день' },
  { value: 'several', label: 'Несколько раз в неделю' },
  { value: 'rare', label: 'Редко' },
  { value: 'almost_never', label: 'Почти никогда' }
];

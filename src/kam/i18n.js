import en from './locales/en.json';
import hi from './locales/hi.json';

export const categories = {
  cleaning: { icon: '🧹', tone: 'peach' },
  tutor: { icon: '📚', tone: 'blue' },
  electrician: { icon: '💡', tone: 'yellow' },
  plumber: { icon: '🔧', tone: 'blue' },
  carpenter: { icon: '🪚', tone: 'peach' },
  cook: { icon: '🍲', tone: 'green' },
  driver: { icon: '🛺', tone: 'yellow' },
  painter: { icon: '🖌️', tone: 'blue' },
  helper: { icon: '🧰', tone: 'green' },
  companion: { icon: '🤝', tone: 'yellow' },
  other: { icon: '✨', tone: 'peach' },
};

const dictionaries = { en, hi };

export function t(locale, key, values = {}) {
  let value = dictionaries[locale]?.[key] ?? en[key] ?? key;
  Object.entries(values).forEach(([name, replacement]) => {
    value = value.replaceAll(`{{${name}}}`, String(replacement));
  });
  return value;
}

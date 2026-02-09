import { getLocale } from './i18n';

export const TYPE_OPTIONS = [
  { value: '领导', zh: '领导', en: 'Boss' },
  { value: '同事', zh: '同事', en: 'Coworker' },
  { value: '前任', zh: '前任', en: 'Ex' },
  { value: '室友', zh: '室友', en: 'Roommate' },
  { value: '甲方', zh: '甲方', en: 'Client' },
  { value: '亲戚', zh: '亲戚', en: 'Relative' },
  { value: '陌生人', zh: '陌生人', en: 'Stranger' },
  { value: '其他', zh: '其他', en: 'Other' }
];

export const getTypeLabel = (value: string) => {
  const locale = getLocale();
  const match = TYPE_OPTIONS.find((item) => item.value === value || item.en === value);
  if (!match) return value;
  return locale === 'zh' ? match.zh : match.en;
};

export const normalizeTypeValue = (input: string) => {
  const trimmed = input.trim();
  const match = TYPE_OPTIONS.find((item) =>
    [item.value, item.zh, item.en].includes(trimmed)
  );
  return match ? match.value : '其他';
};

const bannedWords = [
  // English
  'fuck', 'fucking', 'shit', 'bullshit', 'bitch', 'asshole', 'bastard', 'dick',
  'pussy', 'cunt', 'motherfucker', 'slut', 'whore',
  // Chinese
  '操你', '操你妈', '傻逼', '傻B', '傻b', '妈的', '他妈的', '去你妈', '你妈',
  '垃圾', '畜生', '狗娘养', '死妈', '死全家', '滚你妈', '王八蛋', '混蛋'
];

const buildRegex = () => {
  const escaped = bannedWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escaped.join('|')})`, 'i');
};

const profanityRegex = buildRegex();

export const containsProfanity = (text: string) => {
  return profanityRegex.test(text);
};

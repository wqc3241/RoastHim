
import { RoastTarget } from './types';

const buildPersonaSeed = (target: Pick<RoastTarget, 'name' | 'type' | 'tags' | 'description'>) => {
  const tagSeed = target.tags.join('-');
  return `${target.name}-${target.type}-${tagSeed}-${target.description.slice(0, 24)}`;
};

export const getPersonaAvatarUrl = (target: Pick<RoastTarget, 'name' | 'type' | 'tags' | 'description'>) => {
  const seed = encodeURIComponent(buildPersonaSeed(target));
  return `https://api.dicebear.com/7.x/personas/png?seed=${seed}&size=400&backgroundColor=b6e3f4,c0aede,ffd5dc,d1d4f9,fde68a`;
};

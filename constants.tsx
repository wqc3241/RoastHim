
import { RoastTarget, RoastComment, Badge, AppUser } from './types';

export const MOCK_TARGETS: RoastTarget[] = [
  {
    id: '1',
    name: '甲方张总',
    type: '甲方',
    description: '改了 47 版方案还说第一版最好，每次都要在下班前 5 分钟发需求。',
    tags: ['#甲方', '#改稿王', '#职场'],
    avatarStyle: 'suit-man',
    avatarUrl: 'https://picsum.photos/seed/target1/200',
    roastCount: 1240,
    totalLikes: 8900,
    heatIndex: 98,
    topRoastPreview: '建议把第一版和第四十七版拼在一起，叫“甲方迷惑行为大赏”。',
    creatorId: 'u1'
  },
  {
    id: '2',
    name: '前任小李',
    type: '前任',
    description: '同时和三个人说晚安，备注全是“宝宝1号”、“宝宝2号”。',
    tags: ['#渣男', '#海王', '#时间管理'],
    avatarStyle: 'fresh-boy',
    avatarUrl: 'https://picsum.photos/seed/target2/200',
    roastCount: 856,
    totalLikes: 4200,
    heatIndex: 85,
    topRoastPreview: '他是海王？那是公海管理员。',
    creatorId: 'u2'
  },
  {
    id: '3',
    name: '室友老刘',
    type: '室友',
    description: '凌晨 3 点外放短视频，笑声穿透三层墙，厕所从来不刷。',
    tags: ['#室友', '#噪音制造机', '#邋遢'],
    avatarStyle: 'uncle',
    avatarUrl: 'https://picsum.photos/seed/target3/200',
    roastCount: 540,
    totalLikes: 3100,
    heatIndex: 72,
    topRoastPreview: '建议你给他买个耳塞，顺便把他的嘴缝上。',
    creatorId: 'u3'
  },
  {
    id: '4',
    name: '领导王姐',
    type: '领导',
    description: '你这个我周末看看啊（永远不看），周一开会问你为什么没动静。',
    tags: ['#职场', '#PUA', '#双标'],
    avatarStyle: 'mature-woman',
    avatarUrl: 'https://picsum.photos/seed/target4/200',
    roastCount: 2300,
    totalLikes: 15600,
    heatIndex: 99,
    topRoastPreview: '王姐看的不是方案，是她那虚无缥缈的掌控感。',
    creatorId: 'u4'
  },
  {
    id: '5',
    name: '楼下大妈',
    type: '邻居',
    description: '每天早上 6 点准时开跳广场舞，音响声音大到我床都在震。',
    tags: ['#邻居', '#广场舞', '#扰民'],
    avatarStyle: 'mystery',
    avatarUrl: 'https://picsum.photos/seed/target5/200',
    roastCount: 310,
    totalLikes: 1200,
    heatIndex: 60,
    topRoastPreview: '建议加入，从内部瓦解她们。',
    creatorId: 'u5'
  },
  {
    id: '6',
    name: '健身房教练',
    type: '陌生人',
    description: '买了课还天天推销新课，说我不练就废了，结果他自己也没肌肉。',
    tags: ['#推销', '#骚扰', '#健身房'],
    avatarStyle: 'suit-man',
    avatarUrl: 'https://picsum.photos/seed/target6/200',
    roastCount: 150,
    totalLikes: 800,
    heatIndex: 45,
    topRoastPreview: '他是教你健身还是教你理财？',
    creatorId: 'u6'
  }
];

export const MOCK_ROASTS: RoastComment[] = [
  {
    id: 'r1',
    targetId: '1',
    userId: 'u10',
    userName: '正义的伙伴',
    userAvatar: 'https://picsum.photos/seed/user1/100',
    content: '张总这哪是甲方，这是我的受难日记。',
    type: 'text',
    likes: 452,
    isChampion: true,
    timestamp: '2小时前'
  },
  {
    id: 'r2',
    targetId: '1',
    userId: 'u11',
    userName: '退堂鼓国家级选手',
    userAvatar: 'https://picsum.photos/seed/user2/100',
    content: '改图可以，得加钱，得加命。',
    type: 'text',
    likes: 128,
    isChampion: false,
    timestamp: '4小时前'
  },
  {
    id: 'r3',
    targetId: '1',
    userId: 'u12',
    userName: '画图狗',
    userAvatar: 'https://picsum.photos/seed/user3/100',
    content: '看看这发际线，都是张总亲手拔掉的。',
    type: 'image',
    mediaUrl: 'https://picsum.photos/seed/bald/400/300',
    likes: 890,
    isChampion: false,
    timestamp: '10分钟前'
  }
];

export const MOCK_BADGES: Badge[] = [
  { id: 'b1', name: '每日骂王', icon: '👑', description: '当日评论获赞数第一名', condition: '单日获赞Top 1', unlocked: true },
  { id: 'b2', name: '连冠达人', icon: '🏆', description: '连续 3 天获得每日骂王', condition: '连续3天冠军', unlocked: false },
  { id: 'b3', name: '百赞骂手', icon: '🔥', description: '单条评论获得 100+ 赞', condition: '100+赞', unlocked: true },
  { id: 'b4', name: '千赞骂手', icon: '💎', description: '单条评论获得 1000+ 赞', condition: '1000+赞', unlocked: false },
  { id: 'b5', name: '投稿达人', icon: '📝', description: '投稿 10 个以上被骂对象', condition: '投稿10+', unlocked: false },
  { id: 'b6', name: '话痨骂手', icon: '💬', description: '累计发布 100 条评论', condition: '100条评论', unlocked: true },
  { id: 'b7', name: '新手上路', icon: '🌱', description: '完成首次骂', condition: '完成首次骂', unlocked: true },
  { id: 'b8', name: '语音达人', icon: '🎤', description: '发布 10 条语音评论', condition: '10条语音', unlocked: false },
  { id: 'b9', name: '配图大师', icon: '🖼️', description: '发布 10 条带图评论', condition: '10条带图', unlocked: false }
];

export const CURRENT_USER: AppUser = {
  id: 'me',
  name: '毒舌小王子',
  avatar: 'https://picsum.photos/seed/me/200',
  badges: ['b1', 'b3', 'b6', 'b7'],
  stats: {
    targetsCreated: 5,
    roastsPosted: 124,
    likesReceived: 3500
  }
};

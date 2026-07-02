


import { EquipmentQuality, AttributeType, EquipmentSlot, MonsterRank, ChestType } from './types';
import { REALMS } from './realmConstants';

export const ORDERED_QUALITIES: EquipmentQuality[] = [
  EquipmentQuality.Common,
  EquipmentQuality.Uncommon,
  EquipmentQuality.Rare,
  EquipmentQuality.Heirloom,
  EquipmentQuality.Mythic,
  EquipmentQuality.Legendary,
  EquipmentQuality.Epic,
  EquipmentQuality.Ancient,
  EquipmentQuality.Supreme,
  EquipmentQuality.Chaos,
  EquipmentQuality.Void,
];

// Base probability for the first quality tier (Common).
// Subsequent tiers are calculated as half of the remaining probability.
export const QUALITY_BASE_PROBABILITY = 0.8;

// --- New Floor System ---
// Base probability for the first monster realm tier (下级佣兵).
export const MONSTER_REALM_BASE_PROBABILITY = 0.8;
// --- End New Floor System ---

export const QUALITY_CONFIG: Record<EquipmentQuality, { color: string; cssClass: string; }> = {
  [EquipmentQuality.Common]:    { color: 'text-gray-400',   cssClass: 'text-gray-400'   },
  [EquipmentQuality.Uncommon]:  { color: 'text-green-500',  cssClass: 'text-green-500'  },
  [EquipmentQuality.Rare]:      { color: 'text-blue-500',   cssClass: 'text-blue-500'   },
  [EquipmentQuality.Heirloom]:  { color: 'text-indigo-400', cssClass: 'text-indigo-400' },
  [EquipmentQuality.Mythic]:    { color: 'text-purple-500', cssClass: 'text-purple-500' },
  [EquipmentQuality.Legendary]: { color: 'text-orange-500', cssClass: 'text-legendary'  },
  [EquipmentQuality.Epic]:      { color: 'text-fuchsia-500',cssClass: 'text-epic'       },
  [EquipmentQuality.Ancient]:   { color: 'text-rose-500',   cssClass: 'text-ancient'    },
  [EquipmentQuality.Supreme]:   { color: 'text-lime-400',   cssClass: 'text-supreme'    },
  [EquipmentQuality.Chaos]:     { color: 'text-red-500',    cssClass: 'text-chaos font-bold' },
  [EquipmentQuality.Void]:      { color: 'text-white',      cssClass: 'text-void font-bold'  },
};

export const MONSTER_RANK_CONFIG: Record<MonsterRank, {
    hpMultiplier: number;
    adMultiplier: number;
    cssClass: string;
    chance: number;
    xpMultiplier: number;
    divinityRange: [number, number];
}> = {
  [MonsterRank.Minion]:   { hpMultiplier: 1,  adMultiplier: 1,  cssClass: 'text-gray-200',                    chance: 0.80,   xpMultiplier: 1,    divinityRange: [1, 9] },
  [MonsterRank.Elite]:    { hpMultiplier: 2,  adMultiplier: 2,  cssClass: 'text-blue-400',                    chance: 0.10,   xpMultiplier: 2,    divinityRange: [10, 24] },
  [MonsterRank.Lord]:     { hpMultiplier: 5,  adMultiplier: 3,  cssClass: 'text-pink-400',                    chance: 0.08,   xpMultiplier: 3,   divinityRange: [25, 49] },
  [MonsterRank.Monarch1]: { hpMultiplier: 10, adMultiplier: 4,  cssClass: 'text-yellow-400 font-bold',        chance: 0.01,   xpMultiplier: 5,   divinityRange: [50, 74] },
  [MonsterRank.Monarch2]: { hpMultiplier: 20, adMultiplier: 5,  cssClass: 'text-monarch-gold font-bold',      chance: 0.008,  xpMultiplier: 10,   divinityRange: [75, 124] },
  [MonsterRank.Monarch3]: { hpMultiplier: 30, adMultiplier: 6,  cssClass: 'text-monarch-dark-gold font-bold', chance: 0.0015, xpMultiplier: 15,  divinityRange: [125, 199] },
  [MonsterRank.Ancient]:  { hpMultiplier: 50, adMultiplier: 7,  cssClass: 'text-ancient-red font-bold',       chance: 0.0005, xpMultiplier: 500,  divinityRange: [200, 200] },
};

export const ATTRIBUTE_CONFIG: Record<AttributeType, { isPercent: boolean; label: string; }> = {
  [AttributeType.Attack]:      { isPercent: false, label: '攻击力' },
  [AttributeType.Defense]:     { isPercent: false, label: '防御力' },
  [AttributeType.MagicResist]: { isPercent: false, label: '魔防' },
  [AttributeType.LifeRegen]:   { isPercent: false, label: '体力恢复' },
  [AttributeType.Divinity]:    { isPercent: false, label: '神性' },
};

// Defines attribute probabilities and base value ranges for '佣兵' tier equipment.
export const ATTRIBUTE_GENERATION_CONFIG: Record<AttributeType, { weight: number; range: [number, number] }> = {
    [AttributeType.Attack]:      { weight: 300,  range: [1, 10] },
    [AttributeType.Defense]:     { weight: 300,  range: [1, 10] },
    [AttributeType.MagicResist]: { weight: 300,  range: [1, 30] },
    [AttributeType.LifeRegen]:   { weight: 75,   range: [1, 6] },
    [AttributeType.Divinity]:    { weight: 25,   range: [1, 2] },
};

export const LOOT_DROP_RATES: Record<MonsterRank, { baseChance: number; chainChance: number; }> = {
  [MonsterRank.Minion]:   { baseChance: 0.05,  chainChance: 0.50 }, // Not in request, kept original value
  [MonsterRank.Elite]:    { baseChance: 0.30,  chainChance: 0.50 },
  [MonsterRank.Lord]:     { baseChance: 0.30,  chainChance: 0.55 },
  [MonsterRank.Monarch1]: { baseChance: 0.60,  chainChance: 0.60 },
  [MonsterRank.Monarch2]: { baseChance: 0.65,  chainChance: 0.65 },
  [MonsterRank.Monarch3]: { baseChance: 0.80,  chainChance: 0.80 },
  [MonsterRank.Ancient]:  { baseChance: 0.90,  chainChance: 0.90 },
};

export const EQUIPMENT_SLOTS_ORDER: EquipmentSlot[] = [
  EquipmentSlot.Helmet, EquipmentSlot.Weapon, EquipmentSlot.Shield,
  EquipmentSlot.Chest, EquipmentSlot.Gloves, EquipmentSlot.Pants,
  EquipmentSlot.Boots, EquipmentSlot.Cloak, EquipmentSlot.Necklace,
  EquipmentSlot.Bracelet, EquipmentSlot.LeftRing, EquipmentSlot.RightRing,
];

// --- NEW EQUIPMENT SYSTEM CONSTANTS ---

export const EQUIPMENT_REALM_TIERS: { name: string; range: [number, number] }[] = [
    { name: '佣兵', range: [0, 6] },
    { name: '职业者', range: [7, 13] },
    { name: '英雄', range: [14, 24] },
    { name: '传奇史诗', range: [25, 31] },
    { name: '超凡', range: [32, 34] },
    { name: '圣者', range: [35, 37] },
    { name: '域主', range: [38, 40] },
    { name: '主宰', range: [41, 45] },
    { name: '超脱', range: [46, 55] },
    { name: '宙光', range: [56, 60] },
    { name: '造物', range: [61, REALMS.length - 1] },
];

export const BREAKTHROUGH_REALM_INDICES = [
    6,  // 荣耀佣兵 -> 职业者
    13, // 半步英雄 -> 英雄
    24, // 半步传奇 -> 传奇史诗
    31, // 史诗巅峰 -> 超凡
    34, // 圣域超凡 -> 圣者
    37, // 入灭圣者 -> 域主
    40, // 上位域主 -> 主宰
    45, // 半神 -> 超脱
    55, // 超脱-皇道极境 -> 宙光
    60  // 律境宙光 -> 造物主
];

export const getRealmTierInfo = (realmIndex: number): { name: string; tierIndex: number } => {
    const tierIndex = EQUIPMENT_REALM_TIERS.findIndex(tier => realmIndex >= tier.range[0] && realmIndex <= tier.range[1]);
    if (tierIndex !== -1) {
        return { name: EQUIPMENT_REALM_TIERS[tierIndex].name, tierIndex };
    }
    // Handle cases for indices before the first tier if any
    if (realmIndex < EQUIPMENT_REALM_TIERS[0].range[0]) {
        return { name: EQUIPMENT_REALM_TIERS[0].name, tierIndex: 0 };
    }
    return { name: '未知', tierIndex: -1 };
};

// --- END NEW EQUIPMENT SYSTEM CONSTANTS ---

// --- NEW DYNAMIC EQUIPMENT NAMING SYSTEM ---
export const EQUIPMENT_PREFIX_CHARS: string[] = [
  '云', '风', '雨', '雾', '雪', '花', '月', '星', '山', '水',
  '柳', '荷', '波', '霞', '晴', '霜', '泉', '潮', '林', '石',
  '情', '恋', '梦', '忆', '恨', '忧', '慕', '爱', '悦', '惜',
  '红', '蓝', '紫', '黛', '玄', '朱', '翠', '青', '银', '金',
  '春', '夏', '秋', '冬', '朝', '暮', '夜', '昔', '昕', '曦',
  '舞', '影', '韵', '香', '韶', '绮', '幽', '禅', '渺', '渊',
  '雅', '素', '贤', '淑', '慧', '逸', '蕴', '映', '灵', '清',
  '纹', '绣', '缦', '锦', '琴', '珠', '玉', '琉', '曼', '缘',
  '墨', '诗', '词', '书', '经', '篇', '章', '文', '句', '典',
  '锋','刃','斩','戟','矛','斧','镰','锤','钺','镖','铗','钩',
  '锥','铩','戈','矢','弩','弓','炮','铳','弹','箭','火','焰',
  '雷','电','霆','炎','炽','燎','爆','疾','迅','遁','闪','击',
  '袭','破','裂','碎','崩','震','灭','毁','穿','掠','扫','踏',
  '突','劈','斫','划','搠','挑','拍','擎','投','擒','擂','挞',
  '锻','炼','冶','铸','锈','铠','甲','盔','胄','靴','袍','袄',
  '襟','褶','鞘','缨','鞭','鞑','骑','驰','驭','骤','骁','骜',
  '骃','腾','跃','凌','翔','飙','飒','征','战','阵','营','哨',
  '岗','旗','鼓','号','旌','帜','斥','巡','戍','烽','烟','寒',
  '冽','凝','冰','冻','雹','苍','漠','烈','冥','煞',
  '魄','魂','魇','魅','鬼','魔','妖','邪','咒','符','印',
  '封','禁','御','守','护','遏','抵','隔','障','缚','链',
  '锁','圈','钉','扣','铆','饰','簪','带','缎','环','珮','珊',
  '珞','琦','玮','瑛','琛','琢','琨','璇','璟','瓒','瓔','璀',
  '斓','曜','煌','烁','熠','熙','炫','灿','暝','黯','昧',
  '晨','曙','宵','寂','默','静','暗','幻','虚','实',
  '界','域','空','维','泽','涯','涧','溪','潭','湾',
  '澜','飞','飘','游','落','行','缓','越','起','归'
];

export const EQUIPMENT_BASE_NAMES: Record<EquipmentSlot, string[]> = {
    [EquipmentSlot.Helmet]: ['盔', '冠', '罩', '帽', '冕', '头', '面', '头箍', '头饰', '面具'],
    [EquipmentSlot.Weapon]: ['剑', '斧', '刀', '锤', '杖', '弓', '矛', '戟', '枪', '刃', '钺', '刺', '鞭', '链', '爪'],
    [EquipmentSlot.Shield]: ['盾', '墙', '牌', '障', '幕', '壁', '镜', '屏'],
    [EquipmentSlot.Chest]: ['铠', '甲', '袍', '衣', '战衣', '胸甲', '长袍', '战铠', '战甲', '战袍', '披甲'],
    [EquipmentSlot.Gloves]: ['护', '手', '拳', '手套', '指套', '拳甲', '战拳', '铁手', '握'],
    [EquipmentSlot.Pants]: ['裤', '腿', '腿甲', '胫', '护腿', '战裤', '战腿', '腿饰'],
    [EquipmentSlot.Boots]: ['靴', '履', '足', '鞋', '战靴', '影履', '神履', '飞靴', '轻履'],
    [EquipmentSlot.Cloak]: ['披风', '裳', '翼', '帷', '羽', '氅', '斗篷', '披', '幔'],
    [EquipmentSlot.Necklace]: ['链', '项', '链坠', '项圈', '魂链', '灵链', '颈饰', '环'],
    [EquipmentSlot.Bracelet]: ['镯', '环', '臂', '臂环', '灵镯', '魂镯', '腕', '护腕', '铁环'],
    [EquipmentSlot.LeftRing]: ['戒', '指', '指环', '魂戒', '魔戒', '灵戒', '印戒', '咒戒', '环'],
    [EquipmentSlot.RightRing]: ['戒', '指', '指环', '魂戒', '魔戒', '灵戒', '印戒', '咒戒', '环'],
};
// --- END NEW DYNAMIC EQUIPMENT NAMING SYSTEM ---

// --- New Monster Naming System ---
export const COMPOUND_SURNAMES = [
  '欧阳', '太史', '端木', '上官', '司马', '东方', '独孤', '南宫', '万俟', '闻人', 
  '夏侯', '诸葛', '尉迟', '公羊', '赫连', '澹台', '皇甫', '宗政', '濮阳', '公冶', 
  '太叔', '申屠', '公孙', '慕容', '仲孙', '钟离', '长孙', '宇文', '司徒', '鲜于', 
  '司空', '闾丘', '子车', '亓官', '司寇', '巫马', '公西', '颛孙', '壤驷', '公良', 
  '漆雕', '乐正', '宰父', '谷梁', '拓跋', '夹谷', '轩辕', '令狐', '段干', '百里', 
  '呼延', '东郭', '南门', '羊舌', '微生', '公户', '公玉', '公仪', '梁丘', '公仲', 
  '公上', '公门', '公山', '公坚', '左丘', '公伯', '西门', '公祖', '第五', '公乘', 
  '贯丘', '公皙', '南荣', '东里', '东宫', '仲长', '子书', '子桑', '即墨', '达奚', '褚师'
];

export const SURNAMES = [
  '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨',
  '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜',
  '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', '云', '苏', '潘', '葛', '奚', '范', '彭', '郎',
  '鲁', '韦', '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '酆', '鲍', '史', '唐',
  '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常',
  '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黄',
  '和', '穆', '萧', '尹', '姚', '邵', '湛', '汪', '祁', '毛', '禹', '狄', '米', '贝', '明', '臧',
  '计', '伏', '成', '戴', '谈', '宋', '茅', '庞', '熊', '纪', '舒', '屈', '项', '祝', '董', '梁',
  '杜', '阮', '蓝', '闵', '席', '季', '麻', '强', '贾', '路', '娄', '危', '江', '童', '颜', '郭',
  '梅', '盛', '林', '刁', '钟', '徐', '邱', '骆', '高', '夏', '蔡', '田', '樊', '胡', '凌', '霍',
  '虞', '万', '支', '柯', '昝', '管', '卢', '莫', '经', '房', '裘', '缪', '干', '解', '应', '宗',
  '丁', '宣', '贲', '邓', '郁', '单', '杭', '洪', '包', '诸', '左', '石', '崔', '吉', '钮', '龚'
];
export const MALE_GIVEN_NAMES = [
  '伟', '强', '磊', '军', '勇', '杰', '超', '明', '涛', '刚', '平', '静', '峰', '斌', '波', '旭',
  '宇', '浩', '凯', '飞', '鹏', '博', '文', '龙', '云', '帅', '洋', '雷', '鑫', '哲', '瑞', '轩',
  '志', '威', '耀', '辉', '晨', '航', '健', '俊', '德', '元', '翰', '凡', '宁', '安', '林', '森',
  '海', '天', '立', '义', '诚', '武', '忠', '信', '达', '泰', '民', '群', '国', '利', '彪', '松',
  '楠', '枫', '栋', '梁', '岩', '山', '川', '石', '田', '白', '墨', '书', '翰', '章', '艺', '儒'
];
export const FEMALE_GIVEN_NAMES = [
  '芳', '秀', '敏', '静', '丽', '娜', '燕', '娟', '红', '玲', '艳', '萍', '莉', '云', '梅', '雪',
  '丹', '慧', '婷', '琳', '菲', '爽', '雅', '琪', '蓉', '倩', '晶', '颖', '霞', '兰', '珍', '姣',
  '婉', '玥', '悦', '瑾', '涵', '蕊', '馨', '怡', '思', '梦', '璐', '瑶', '宁', '欣', '莎', '媛',
  '月', '花', '香', '玉', '珠', '佩', '青', '春', '秋', '夏', '冬', '冰', '霜', '虹', '彩', '翠',
  '雁', '凤', '凰', '莺', '蝶', '莺', '芝', '竹', '松', '菊', '桂'
];
// --- End New Monster Naming System ---

export const MONSTER_BASE_STATS = {
    health: 0,
    attack: 0,
    defense: 0,
    divinity: 0,
    lifeRegen: 0,
};

export const PLAYER_BASE_STATS = {
  maxHealth: 100,
  attack: 10,
  defense: 10,
  magicResist: 20,
  lifeRegen: 0,
  divinity: 0,
};

// --- Chest Constants ---
export const CHEST_CONFIG: Record<ChestType, { baseQuality: EquipmentQuality, color: string, textColor?: string, chainChance: number }> = {
    [ChestType.Wood]:   { baseQuality: EquipmentQuality.Uncommon,  color: 'bg-yellow-800',                     chainChance: 0.50 },
    [ChestType.Iron]:   { baseQuality: EquipmentQuality.Rare,      color: 'bg-cyan-800',                       chainChance: 0.55 },
    [ChestType.Copper]: { baseQuality: EquipmentQuality.Heirloom,  color: 'bg-orange-700',                     chainChance: 0.60 },
    [ChestType.Silver]: { baseQuality: EquipmentQuality.Mythic,    color: 'bg-slate-300',  textColor: 'text-blue-800 font-bold', chainChance: 0.65 },
    [ChestType.Gold]:   { baseQuality: EquipmentQuality.Legendary, color: 'bg-yellow-500', textColor: 'text-black font-bold',    chainChance: 0.70 },
    [ChestType.Ancient]:{ baseQuality: EquipmentQuality.Epic,      color: 'bg-ancient-chest-gradient', textColor: 'text-ancient-chest-text font-bold', chainChance: 0.75 },
};

export const CHEST_TYPE_PROBABILITY: { type: ChestType, chance: number }[] = [
    { type: ChestType.Wood,    chance: 0.80 },
    { type: ChestType.Iron,    chance: 0.10 },
    { type: ChestType.Copper,  chance: 0.05 },
    { type: ChestType.Silver,  chance: 0.03 },
    { type: ChestType.Gold,    chance: 0.015 },
    { type: ChestType.Ancient, chance: 0.005 },
];
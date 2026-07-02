
export interface Realm {
  name: string;
  xpToNext: number;
  totalHpBonus: number;
  totalPointsBonus: number;
}

// Stats are cumulative totals for that realm
const tempRealms: Omit<Realm, 'xpToNext'>[] = [
    // 佣兵
    { name: '下级佣兵', totalHpBonus: 50, totalPointsBonus: 20 },
    { name: '中级佣兵', totalHpBonus: 100, totalPointsBonus: 40 },
    { name: '高级佣兵', totalHpBonus: 200, totalPointsBonus: 80 },
    { name: '特级佣兵', totalHpBonus: 400, totalPointsBonus: 160 },
    { name: '王牌佣兵', totalHpBonus: 800, totalPointsBonus: 320 },
    { name: '荣耀佣兵', totalHpBonus: 1600, totalPointsBonus: 640 },
    { name: '辉煌佣兵', totalHpBonus: 3200, totalPointsBonus: 1280 },

    // 职业者
    { name: '黑铁职业者', totalHpBonus: 6400, totalPointsBonus: 2560 },
    { name: '青铜职业者', totalHpBonus: 12800, totalPointsBonus: 5120 },
    { name: '白银职业者', totalHpBonus: 25600, totalPointsBonus: 10240 },
    { name: '黄金职业者', totalHpBonus: 51200, totalPointsBonus: 20480 },
    { name: '蓝玉职业者', totalHpBonus: 102400, totalPointsBonus: 40960 },
    { name: '紫晶职业者', totalHpBonus: 204800, totalPointsBonus: 81920 },
    { name: '半步英雄', totalHpBonus: 409600, totalPointsBonus: 163840 },

    // 下位英雄
    { name: '英雄一阶', totalHpBonus: 819200, totalPointsBonus: 327680 },
    { name: '英雄二阶', totalHpBonus: 1638400, totalPointsBonus: 655360 },
    { name: '英雄三阶', totalHpBonus: 3276800, totalPointsBonus: 1310720 },
    { name: '英雄四阶', totalHpBonus: 6553600, totalPointsBonus: 2621440 },
    { name: '英雄五阶', totalHpBonus: 13107200, totalPointsBonus: 5242880 },
    
    // 上位英雄
    { name: '英雄六阶', totalHpBonus: 26214400, totalPointsBonus: 10485760 },
    { name: '英雄七阶', totalHpBonus: 52428800, totalPointsBonus: 20971520 },
    { name: '英雄八阶', totalHpBonus: 104857600, totalPointsBonus: 41943040 },
    { name: '英雄九阶', totalHpBonus: 209715200, totalPointsBonus: 83886080 },
    { name: '半步传奇', totalHpBonus: 419430400, totalPointsBonus: 167772160 },

    // 传奇史诗
    { name: '传奇初成', totalHpBonus: 838860800, totalPointsBonus: 335544320 },
    { name: '传奇大成', totalHpBonus: 1677721600, totalPointsBonus: 671088640 },
    { name: '传奇圆满', totalHpBonus: 3355443200, totalPointsBonus: 1342177280 },
    { name: '史诗初阶', totalHpBonus: 6710886400, totalPointsBonus: 2684354560 },
    { name: '史诗中阶', totalHpBonus: 13421772800, totalPointsBonus: 5368709120 },
    { name: '史诗高阶', totalHpBonus: 26843545600, totalPointsBonus: 10737418240 },
    { name: '史诗巅峰', totalHpBonus: 53687091200, totalPointsBonus: 21474836480 },
    
    // 超凡生命
    { name: '初始超凡', totalHpBonus: 107374182400, totalPointsBonus: 42949672960 },
    { name: '高等超凡', totalHpBonus: 214748364800, totalPointsBonus: 85899345920 },
    { name: '圣域超凡', totalHpBonus: 429496729600, totalPointsBonus: 171798691840 },
    
    // 圣者
    { name: '炼星圣者', totalHpBonus: 858993459200, totalPointsBonus: 343597383680 },
    { name: '破虚圣者', totalHpBonus: 1717986918400, totalPointsBonus: 687194767360 },
    { name: '入灭圣者', totalHpBonus: 3435973836800, totalPointsBonus: 1374389534720 },

    // 域主
    { name: '下位域主', totalHpBonus: 6871947673600, totalPointsBonus: 2748779069440 },
    { name: '中位域主', totalHpBonus: 13743895347200, totalPointsBonus: 5497558138880 },
    { name: '上位域主', totalHpBonus: 27487790694400, totalPointsBonus: 10995116277760 },
    
    // 主宰
    { name: '初始主宰', totalHpBonus: 54975581388800, totalPointsBonus: 21990232555520 },
    { name: '宇光主宰', totalHpBonus: 109951162777600, totalPointsBonus: 43980465111040 },
    { name: '宙海主宰', totalHpBonus: 219902325555200, totalPointsBonus: 87960930222080 },
    { name: '巅峰主宰', totalHpBonus: 439804651110400, totalPointsBonus: 175921860444160 },
    { name: '半神', totalHpBonus: 879609302220800, totalPointsBonus: 351843720888320 },

    // 超脱 (No more doubling, progression slows)
    { name: '超脱-新生', totalHpBonus: 1.7e15, totalPointsBonus: 7e14 },
    { name: '超脱-固体', totalHpBonus: 3.5e15, totalPointsBonus: 1.4e15 },
    { name: '超脱-炼神', totalHpBonus: 7e15, totalPointsBonus: 2.8e15 },
    { name: '超脱-辟宫', totalHpBonus: 1.4e16, totalPointsBonus: 5.6e15 },
    { name: '超脱-筑坛', totalHpBonus: 2.8e16, totalPointsBonus: 1.12e16 },
    { name: '超脱-引命', totalHpBonus: 5.6e16, totalPointsBonus: 2.24e16 },
    { name: '超脱-命轮', totalHpBonus: 1.12e17, totalPointsBonus: 4.48e16 },
    { name: '超脱-悬海', totalHpBonus: 2.24e17, totalPointsBonus: 8.96e16 },
    { name: '超脱-空解', totalHpBonus: 4.48e17, totalPointsBonus: 1.792e17 },
    { name: '超脱-皇道极境', totalHpBonus: 8.96e17, totalPointsBonus: 3.584e17 },

    // 宙光
    { name: '奇点宙光', totalHpBonus: 1.792e18, totalPointsBonus: 7.168e17 },
    { name: '开弦宙光', totalHpBonus: 3.584e18, totalPointsBonus: 1.4336e18 },
    { name: '闭弦宙光', totalHpBonus: 7.168e18, totalPointsBonus: 2.8672e18 },
    { name: '虚粒宙光', totalHpBonus: 1.4336e19, totalPointsBonus: 5.7344e18 },
    { name: '律境宙光', totalHpBonus: 2.8672e19, totalPointsBonus: 1.14688e19 },
    
    // 造物主
    { name: '虚空造物', totalHpBonus: 5.7344e19, totalPointsBonus: 2.29376e19 },
    { name: '规则掌控', totalHpBonus: 1.14688e20, totalPointsBonus: 4.58752e19 },
    { name: '命源跃迁', totalHpBonus: 2.29376e20, totalPointsBonus: 9.17504e19 },
];

export const REALMS: Realm[] = tempRealms.map((realm, index) => ({
    ...realm,
    xpToNext: 100 * Math.pow(2, index)
}));

// Set the final realm to have infinite XP requirement
if (REALMS.length > 0) {
    REALMS[REALMS.length - 1].xpToNext = Infinity;
}

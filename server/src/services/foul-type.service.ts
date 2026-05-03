/**
 * 犯规类型服务
 * 按运动项目分类，每种运动有独立的犯规类型定义
 */

export interface FoulType {
  id: string;
  sportType: string;        // 运动类型: basketball, football, volleyball, etc.
  code: string;            // 犯规代码: personal_foul, technical_foul, etc.
  name: string;           // 中文名称
  nameEn: string;          // 英文名称
  severity: 'minor' | 'common' | 'severe' | 'dangerous';  // 严重程度
  penalty: {
    type: 'free_throw' | 'possession' | 'suspension' | 'yellow_card' | 'red_card' | 'penalty_kick' | 'point_deduction' | 'warning';
    duration?: number;     // 罚时（秒），如篮球违体犯规的罚球
    points?: number;       // 罚分
    description: string;    // 处罚说明
  };
  description: string;     // 犯规说明
  videoExample?: string;   // 视频示例描述
}

// 所有运动类型的犯规定义
const FOUL_TYPES: FoulType[] = [
  // ==================== 篮球 ====================
  {
    id: 'bb_personal',
    sportType: 'basketball',
    code: 'personal_foul',
    name: '个人犯规',
    nameEn: 'Personal Foul',
    severity: 'common',
    penalty: { type: 'possession', description: '对方获得球权' },
    description: '球员与对方球员发生非法身体接触'
  },
  {
    id: 'bb_shooting',
    sportType: 'basketball',
    code: 'shooting_foul',
    name: '投篮犯规',
    nameEn: 'Shooting Foul',
    severity: 'common',
    penalty: { type: 'free_throw', duration: 2, description: '2或3次罚球' },
    description: '投篮时被犯规'
  },
  {
    id: 'bb_unsp',
    sportType: 'basketball',
    code: 'unsportsmanlike_foul',
    name: '违反体育道德犯规',
    nameEn: 'Unsportsmanlike Foul',
    severity: 'severe',
    penalty: { type: 'free_throw', duration: 2, description: '2次罚球+对方球权' },
    description: '不必要的身体接触或危险动作'
  },
  {
    id: 'bb_technical',
    sportType: 'basketball',
    code: 'technical_foul',
    name: '技术犯规',
    nameEn: 'Technical Foul',
    severity: 'severe',
    penalty: { type: 'free_throw', duration: 1, description: '1次罚球' },
    description: '违反比赛规则（言语、行为等）'
  },
  {
    id: 'bb_flagrant1',
    sportType: 'basketball',
    code: 'flagrant_foul_1',
    name: '恶意犯规（1级）',
    nameEn: 'Flagrant Foul 1',
    severity: 'severe',
    penalty: { type: 'free_throw', duration: 2, description: '2次罚球+球权' },
    description: '不必要的过度身体接触'
  },
  {
    id: 'bb_flagrant2',
    sportType: 'basketball',
    code: 'flagrant_foul_2',
    name: '恶意犯规（2级）',
    nameEn: 'Flagrant Foul 2',
    severity: 'dangerous',
    penalty: { type: 'suspension', duration: 0, description: '直接驱逐出场' },
    description: '极端过度的身体接触或暴力行为'
  },
  {
    id: 'bb_offensive',
    sportType: 'basketball',
    code: 'offensive_foul',
    name: '进攻犯规',
    nameEn: 'Offensive Foul',
    severity: 'common',
    penalty: { type: 'possession', description: '失去球权' },
    description: '进攻方非法阻碍防守'
  },
  {
    id: 'bb_double',
    sportType: 'basketball',
    code: 'double_foul',
    name: '双方犯规',
    nameEn: 'Double Foul',
    severity: 'common',
    penalty: { type: 'possession', description: '跳球' },
    description: '双方同时犯规'
  },
  {
    id: 'bb_reaching',
    sportType: 'basketball',
    code: 'reaching_in',
    name: '伸手犯规',
    nameEn: 'Reaching In',
    severity: 'minor',
    penalty: { type: 'possession', description: '对方球权' },
    description: '伸手抢球时的非法接触'
  },
  {
    id: 'bb_holding',
    sportType: 'basketball',
    code: 'holding',
    name: '拉人犯规',
    nameEn: 'Holding',
    severity: 'common',
    penalty: { type: 'possession', description: '对方球权' },
    description: '用手或手臂阻止对方移动'
  },
  {
    id: 'bb_pushing',
    sportType: 'basketball',
    code: 'pushing',
    name: '推人犯规',
    nameEn: 'Pushing',
    severity: 'common',
    penalty: { type: 'possession', description: '对方球权' },
    description: '用身体推挤对方'
  },
  {
    id: 'bb_blocking',
    sportType: 'basketball',
    code: 'blocking',
    name: '阻挡犯规',
    nameEn: 'Blocking',
    severity: 'common',
    penalty: { type: 'possession', description: '对方球权' },
    description: '防守时非法阻碍进攻球员'
  },
  {
    id: 'bb_traveling',
    sportType: 'basketball',
    code: 'traveling',
    name: '走步违例',
    nameEn: 'Traveling',
    severity: 'minor',
    penalty: { type: 'possession', description: '对方球权' },
    description: '持球移动超出规定步数'
  },
  {
    id: 'bb_shot_clock',
    sportType: 'basketball',
    code: 'shot_clock_violation',
    name: '进攻时限违例',
    nameEn: 'Shot Clock Violation',
    severity: 'minor',
    penalty: { type: 'possession', description: '对方球权' },
    description: '24秒进攻时限内未投篮'
  },
  {
    id: 'bb_3sec',
    sportType: 'basketball',
    code: 'three_second_violation',
    name: '三秒违例',
    nameEn: 'Three Second Violation',
    severity: 'minor',
    penalty: { type: 'possession', description: '对方球权' },
    description: '进攻方在限制区内停留超过3秒'
  },

  // ==================== 足球 ====================
  {
    id: 'fb_handball',
    sportType: 'football',
    code: 'handball',
    name: '手球',
    nameEn: 'Handball',
    severity: 'common',
    penalty: { type: 'free_throw', description: '对方间接/直接任意球或点球' },
    description: '故意用手或手臂触球'
  },
  {
    id: 'fb_foul',
    sportType: 'football',
    code: 'direct_foul',
    name: '直接任意球犯规',
    nameEn: 'Direct Free Kick Foul',
    severity: 'common',
    penalty: { type: 'free_throw', description: '直接任意球' },
    description: '抢截时使用过度力量或危险动作'
  },
  {
    id: 'fb_indirect',
    sportType: 'football',
    code: 'indirect_foul',
    name: '间接任意球犯规',
    nameEn: 'Indirect Free Kick Foul',
    severity: 'common',
    penalty: { type: 'free_throw', description: '间接任意球' },
    description: '越位、门将手接回传球等'
  },
  {
    id: 'fb_yellow',
    sportType: 'football',
    code: 'yellow_card',
    name: '黄牌警告',
    nameEn: 'Yellow Card',
    severity: 'severe',
    penalty: { type: 'yellow_card', description: '警告，累计2张黄牌变红牌' },
    description: '言语抗议、轻微犯规、延误比赛等'
  },
  {
    id: 'fb_second_yellow',
    sportType: 'football',
    code: 'second_yellow',
    name: '第二张黄牌',
    nameEn: 'Second Yellow Card',
    severity: 'dangerous',
    penalty: { type: 'red_card', description: '红牌离场（两黄变一红）' },
    description: '累计第二张黄牌'
  },
  {
    id: 'fb_red',
    sportType: 'football',
    code: 'red_card',
    name: '红牌',
    nameEn: 'Red Card',
    severity: 'dangerous',
    penalty: { type: 'suspension', duration: 0, description: '直接驱逐出场' },
    description: '暴力行为、严重犯规、侮辱行为'
  },
  {
    id: 'fb_offside',
    sportType: 'football',
    code: 'offside',
    name: '越位',
    nameEn: 'Offside',
    severity: 'minor',
    penalty: { type: 'possession', description: '对方间接任意球' },
    description: '越位位置参与进攻'
  },
  {
    id: 'fb_penalty',
    sportType: 'football',
    code: 'penalty_foul',
    name: '点球犯规',
    nameEn: 'Penalty Foul',
    severity: 'severe',
    penalty: { type: 'penalty_kick', description: '点球' },
    description: '在禁区内对进攻球员犯规'
  },
  {
    id: 'fb_simulation',
    sportType: 'football',
    code: 'simulation',
    name: '假摔',
    nameEn: 'Simulation/Diving',
    severity: 'severe',
    penalty: { type: 'yellow_card', description: '黄牌警告' },
    description: '假装被犯规以获得任意球或点球'
  },
  {
    id: 'fb_dangerous',
    sportType: 'football',
    code: 'dangerous_play',
    name: '危险动作',
    nameEn: 'Dangerous Play',
    severity: 'common',
    penalty: { type: 'free_throw', description: '间接任意球' },
    description: '可能伤害自己或他人的动作'
  },
  {
    id: 'fb_obstruction',
    sportType: 'football',
    code: 'obstruction',
    name: '阻挡',
    nameEn: 'Obstruction',
    severity: 'common',
    penalty: { type: 'free_throw', description: '对方任意球' },
    description: '用身体阻挡无球球员'
  },
  {
    id: 'fb_back_pass',
    sportType: 'football',
    code: 'back_pass',
    name: '回传球',
    nameEn: 'Back Pass',
    severity: 'minor',
    penalty: { type: 'free_throw', description: '间接任意球' },
    description: '门将手接队友回传球'
  },
  {
    id: 'fb_time_waste',
    sportType: 'football',
    code: 'time_wasting',
    name: '拖延比赛',
    nameEn: 'Time Wasting',
    severity: 'minor',
    penalty: { type: 'warning', description: '黄牌警告' },
    description: '故意拖延比赛时间'
  },
  {
    id: 'fb_kick_off',
    sportType: 'football',
    code: 'kick_off_early',
    name: '提前开球',
    nameEn: 'Early Kick-off',
    severity: 'minor',
    penalty: { type: 'warning', description: '黄牌警告' },
    description: '未获裁判允许提前开球'
  },

  // ==================== 排球 ====================
  {
    id: 'vb_net_foul',
    sportType: 'volleyball',
    code: 'net_foul',
    name: '网前犯规',
    nameEn: 'Net Foul',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '触网、穿越中线、拦网触网'
  },
  {
    id: 'vb_net_touch',
    sportType: 'volleyball',
    code: 'net_touch',
    name: '触网',
    nameEn: 'Net Touch',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '触碰到球网'
  },
  {
    id: 'vb_foot_fault',
    sportType: 'volleyball',
    code: 'foot_fault',
    name: '脚过中线',
    nameEn: 'Foot Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '脚或手越过中线触及对方区域'
  },
  {
    id: 'vb_four_hit',
    sportType: 'volleyball',
    code: 'four_hits',
    name: '四次击球',
    nameEn: 'Four Hits',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '同一球队触球超过3次'
  },
  {
    id: 'vb_double_hit',
    sportType: 'volleyball',
    code: 'double_hit',
    name: '连击',
    nameEn: 'Double Hit',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '同一人连续触球2次（除拦网外）'
  },
  {
    id: 'vb_throw',
    sportType: 'volleyball',
    code: 'throw',
    name: '持球',
    nameEn: 'Throw',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球被抓住或抛出'
  },
  {
    id: 'vb_catch',
    sportType: 'volleyball',
    code: 'catch',
    name: '接住球',
    nameEn: 'Catch',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '用单手或双手接住球'
  },
  {
    id: 'vb_over_net',
    sportType: 'volleyball',
    code: 'over_net',
    name: '过网击球',
    nameEn: 'Crossing Net Plane',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '在对方空间击球或触球'
  },
  {
    id: 'vb_overlap',
    sportType: 'volleyball',
    code: 'rotation_fault',
    name: '轮转错误',
    nameEn: 'Rotation Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '发球时轮转顺序错误'
  },
  {
    id: 'vb_serve_fault',
    sportType: 'volleyball',
    code: 'service_fault',
    name: '发球失误',
    nameEn: 'Service Fault',
    severity: 'minor',
    penalty: { type: 'possession', description: '对方得分或换发球' },
    description: '发球踩线、未抛球、落入界外等'
  },
  {
    id: 'vb_in_out',
    sportType: 'volleyball',
    code: 'in_out',
    name: '界内界外',
    nameEn: 'In/Out',
    severity: 'minor',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球落在界线外或触及界线'
  },
  {
    id: 'vb_block_touch',
    sportType: 'volleyball',
    code: 'block_touch',
    name: '拦网触球',
    nameEn: 'Block Touch',
    severity: 'minor',
    penalty: { type: 'possession', description: '继续比赛' },
    description: '拦网时触球，计入球队击球次数'
  },

  // ==================== 羽毛球 ====================
  {
    id: 'bd_fault',
    sportType: 'badminton',
    code: 'fault',
    name: '犯规',
    nameEn: 'Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球落在界线外、没过网、触地等'
  },
  {
    id: 'bd_net',
    sportType: 'badminton',
    code: 'net_fault',
    name: '触网犯规',
    nameEn: 'Net Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球拍或身体触网'
  },
  {
    id: 'bd_service',
    sportType: 'badminton',
    code: 'service_fault',
    name: '发球违例',
    nameEn: 'Service Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '发球姿势、脚步、拍面角度违规'
  },
  {
    id: 'bd_double_touch',
    sportType: 'badminton',
    code: 'double_touch',
    name: '两次击球',
    nameEn: 'Double Hit',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '同一人连续击球2次'
  },
  {
    id: 'bd_obstruction',
    sportType: 'badminton',
    code: 'obstruction',
    name: '阻挡',
    nameEn: 'Obstruction',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '故意阻碍对方视线或击球'
  },
  {
    id: 'bd_touch',
    sportType: 'badminton',
    code: 'touch_shuttlecock',
    name: '触拍',
    nameEn: 'Touch Racket',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球拍触拍两次或握拍手触球'
  },

  // ==================== 乒乓球 ====================
  {
    id: 'tt_fault',
    sportType: 'table_tennis',
    code: 'fault',
    name: '犯规',
    nameEn: 'Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球未合法回击'
  },
  {
    id: 'tt_net',
    sportType: 'table_tennis',
    code: 'net_service',
    name: '擦网',
    nameEn: 'Net Service',
    severity: 'common',
    penalty: { type: 'possession', description: '重新发球' },
    description: '发球擦网后落入对方台面（重发）'
  },
  {
    id: 'tt_service_fault',
    sportType: 'table_tennis',
    code: 'service_fault',
    name: '发球违例',
    nameEn: 'Service Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '抛球高度、旋转、遮挡违规'
  },
  {
    id: 'tt_double_bounce',
    sportType: 'table_tennis',
    code: 'double_bounce',
    name: '两跳',
    nameEn: 'Double Bounce',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球在己方台面弹跳两次'
  },
  {
    id: 'tt_not_over',
    sportType: 'table_tennis',
    code: 'not_over_net',
    name: '未过网',
    nameEn: 'Not Over Net',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球未越过球网或从侧面绕过'
  },
  {
    id: 'tt_touch',
    sportType: 'table_tennis',
    code: 'touch_net',
    name: '触网',
    nameEn: 'Touch Net',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '球触及球网装置或对方球台前缘'
  },

  // ==================== 网球 ====================
  {
    id: 'tn_fault',
    sportType: 'tennis',
    code: 'fault',
    name: '失误',
    nameEn: 'Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '重新发球或对方得分' },
    description: '发球失误（双误则失分）'
  },
  {
    id: 'tn_net',
    sportType: 'tennis',
    code: 'net_service',
    name: '擦网',
    nameEn: 'Net Service',
    severity: 'common',
    penalty: { type: 'possession', description: '重新发球' },
    description: '发球擦网后落入有效区（重发）'
  },
  {
    id: 'tn_foot',
    sportType: 'tennis',
    code: 'foot_fault',
    name: '脚误',
    nameEn: 'Foot Fault',
    severity: 'common',
    penalty: { type: 'possession', description: '警告或失分' },
    description: '发球时踩线或离开地面'
  },
  {
    id: 'tn_obstruction',
    sportType: 'tennis',
    code: 'obstruction',
    name: '阻碍',
    nameEn: 'Obstruction',
    severity: 'common',
    penalty: { type: 'possession', description: '对方得分' },
    description: '故意阻碍对手击球'
  },
  {
    id: 'tn_code',
    sportType: 'tennis',
    code: 'code_violation',
    name: '违反行为准则',
    nameEn: 'Code Violation',
    severity: 'severe',
    penalty: { type: 'point_deduction', points: 1, description: '警告→罚分→罚局' },
    description: '言语辱骂、摔拍、延误比赛等'
  },
  {
    id: 'tn_time',
    sportType: 'tennis',
    code: 'time_violation',
    name: '超时违例',
    nameEn: 'Time Violation',
    severity: 'minor',
    penalty: { type: 'warning', description: '警告→罚分' },
    description: '发球超时25秒'
  },

  // ==================== 游泳 ====================
  {
    id: 'sw_false_start',
    sportType: 'swimming',
    code: 'false_start',
    name: '抢跳',
    nameEn: 'False Start',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '在发令枪响前出发'
  },
  {
    id: 'sw_stroke',
    sportType: 'swimming',
    code: 'stroke_violation',
    name: '泳姿违规',
    nameEn: 'Stroke Violation',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '未按正确泳姿游泳'
  },
  {
    id: 'sw_touch',
    sportType: 'swimming',
    code: 'touch_violation',
    name: '触壁违规',
    nameEn: 'Touch Violation',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '转身或终点时未正确触壁'
  },
  {
    id: 'sw_walk',
    sportType: 'swimming',
    code: 'walking',
    name: '行走',
    nameEn: 'Walking',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '在水中行走（蛙泳除外）'
  },
  {
    id: 'sw_dq',
    sportType: 'swimming',
    code: 'disqualification',
    name: '取消资格',
    nameEn: 'Disqualification',
    severity: 'dangerous',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '违反其他比赛规则'
  },
  {
    id: 'sw_relay',
    sportType: 'swimming',
    code: 'early_exchange',
    name: '早接',
    nameEn: 'Early Exchange',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消接力队成绩' },
    description: '前一运动员未触壁后一运动员出发'
  },

  // ==================== 田径/跑步 ====================
  {
    id: 'run_false_start',
    sportType: 'running',
    code: 'false_start',
    name: '抢跑',
    nameEn: 'False Start',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '警告→取消资格' },
    description: '在发令枪响前起动'
  },
  {
    id: 'run_lane',
    sportType: 'running',
    code: 'lane_violation',
    name: '串道',
    nameEn: 'Lane Violation',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '跑出己道或阻碍他人'
  },
  {
    id: 'run_obstruction',
    sportType: 'running',
    code: 'obstruction',
    name: '阻挡',
    nameEn: 'Obstruction',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '故意阻挡其他运动员'
  },
  {
    id: 'run_improper',
    sportType: 'running',
    code: 'improper_race',
    name: '不正当行为',
    nameEn: 'Improper Conduct',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格' },
    description: '接受帮助、擅自离开赛道等'
  },
  {
    id: 'run_shoe',
    sportType: 'running',
    code: 'shoe_violation',
    name: '鞋类违规',
    nameEn: 'Shoe Violation',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消比赛资格或要求更换' },
    description: '使用不符合规定的鞋'
  },
  {
    id: 'run_token',
    sportType: 'running',
    code: 'token_violation',
    name: '接力区违规',
    nameEn: 'Exchange Zone Violation',
    severity: 'severe',
    penalty: { type: 'suspension', duration: 0, description: '取消接力队成绩' },
    description: '接力棒交接超出接力区'
  }
];

/**
 * 获取所有犯规类型
 */
export function getAllFoulTypes(): FoulType[] {
  return FOUL_TYPES;
}

/**
 * 根据运动类型获取犯规类型列表
 */
export function getFoulTypesBySport(sportType: string): FoulType[] {
  return FOUL_TYPES.filter(f => f.sportType === sportType);
}

/**
 * 根据运动类型和严重程度获取犯规类型
 */
export function getFoulTypesBySeverity(sportType: string, severity: string): FoulType[] {
  return FOUL_TYPES.filter(f => f.sportType === sportType && f.severity === severity);
}

/**
 * 获取犯规类型详情
 */
export function getFoulTypeById(id: string): FoulType | undefined {
  return FOUL_TYPES.find(f => f.id === id);
}

/**
 * 获取所有支持的运动类型
 */
export function getSupportedSportTypes(): string[] {
  return [...new Set(FOUL_TYPES.map(f => f.sportType))];
}

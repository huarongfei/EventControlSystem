import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getSportRule } from '../src/config/sport-rules';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with multi-sport data...');

  // ─── Teams ────────────────────────────────────────────
  const team1 = await prisma.team.create({
    data: {
      id: uuidv4(), name: '华东理工大学', shortName: '华理',
      players: {
        create: [
          { id: uuidv4(), name: '张三', number: 7 },
          { id: uuidv4(), name: '李四', number: 9 },
          { id: uuidv4(), name: '王五', number: 12 },
          { id: uuidv4(), name: '赵六', number: 15 },
        ],
      },
    },
    include: { players: true },
  });

  const team2 = await prisma.team.create({
    data: {
      id: uuidv4(), name: '交通大学', shortName: '交大',
      players: {
        create: [
          { id: uuidv4(), name: '钱七', number: 5 },
          { id: uuidv4(), name: '孙八', number: 8 },
          { id: uuidv4(), name: '周九', number: 11 },
          { id: uuidv4(), name: '吴十', number: 13 },
        ],
      },
    },
    include: { players: true },
  });

  const team3 = await prisma.team.create({
    data: {
      id: uuidv4(), name: '复旦大学', shortName: '复旦',
      players: {
        create: [
          { id: uuidv4(), name: '陈一', number: 1 },
          { id: uuidv4(), name: '刘二', number: 3 },
          { id: uuidv4(), name: '周明', number: 6 },
          { id: uuidv4(), name: '吴刚', number: 10 },
        ],
      },
    },
    include: { players: true },
  });

  const team4 = await prisma.team.create({
    data: {
      id: uuidv4(), name: '同济大学', shortName: '同济',
      players: {
        create: [
          { id: uuidv4(), name: '郑强', number: 2 },
          { id: uuidv4(), name: '王芳', number: 4 },
          { id: uuidv4(), name: '李娜', number: 7 },
          { id: uuidv4(), name: '赵龙', number: 11 },
        ],
      },
    },
    include: { players: true },
  });

  // ─── A类运动种子 ────────────────────────────────────────

  // 篮球：2026年上海市大学生篮球联赛
  const basketballRule = getSportRule('basketball');
  const basketballEvent = await prisma.event.create({
    data: {
      id: uuidv4(),
      name: '2026年上海市大学生篮球联赛',
      sportType: 'basketball',
      category: 'team',
      startTime: new Date(),
      status: 'live',
      scoreRules: JSON.stringify(basketballRule),
    },
  });

  const basketballMatch = await prisma.match.create({
    data: {
      id: uuidv4(),
      eventId: basketballEvent.id,
      category: 'team',
      sportType: 'basketball',
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      status: 'running',
      currentPeriod: 2,
      periodDuration: 10,
      matchTime: '15:32',
      homeScore: 45,
      awayScore: 38,
      startedAt: new Date(),
    },
  });

  await prisma.matchEvent.createMany({
    data: [
      { id: uuidv4(), matchId: basketballMatch.id, type: 'score', period: 1, teamId: team1.id, playerId: team1.players[0].id, detail: JSON.stringify({ points: 2 }), reportedBy: 'system' },
      { id: uuidv4(), matchId: basketballMatch.id, type: 'score', period: 1, teamId: team2.id, playerId: team2.players[0].id, detail: JSON.stringify({ points: 3 }), reportedBy: 'system' },
      { id: uuidv4(), matchId: basketballMatch.id, type: 'foul', period: 2, teamId: team1.id, playerId: team1.players[1].id, reportedBy: 'referee-1' },
    ],
  });

  // 足球：2026年上海市大学生足球联赛
  const footballRule = getSportRule('football');
  const footballEvent = await prisma.event.create({
    data: {
      id: uuidv4(),
      name: '2026年上海市大学生足球联赛',
      sportType: 'football',
      category: 'team',
      startTime: new Date(),
      status: 'upcoming',
      scoreRules: JSON.stringify(footballRule),
    },
  });

  const footballMatch = await prisma.match.create({
    data: {
      id: uuidv4(),
      eventId: footballEvent.id,
      category: 'team',
      sportType: 'football',
      homeTeamId: team3.id,
      awayTeamId: team4.id,
      status: 'not_started',
      currentPeriod: 1,
      periodDuration: 45,
      matchTime: '45:00',
      homeScore: 0,
      awayScore: 0,
    },
  });

  // 排球：2026年大学生排球杯赛
  const volleyballRule = getSportRule('volleyball');
  const volleyballEvent = await prisma.event.create({
    data: {
      id: uuidv4(),
      name: '2026年大学生排球杯赛',
      sportType: 'volleyball',
      category: 'team',
      startTime: new Date(),
      status: 'upcoming',
      scoreRules: JSON.stringify(volleyballRule),
    },
  });

  const volleyballMatch = await prisma.match.create({
    data: {
      id: uuidv4(),
      eventId: volleyballEvent.id,
      category: 'team',
      sportType: 'volleyball',
      homeTeamId: team1.id,
      awayTeamId: team3.id,
      status: 'not_started',
      currentPeriod: 1,
      periodDuration: 0,
      periodGoal: 25,
      matchTime: '00:00',
      homeScore: 0,
      awayScore: 0,
    },
  });

  // ─── B类运动种子 ────────────────────────────────────────

  // 游泳：2026年大学生游泳锦标赛
  const swimmingRule = getSportRule('swimming');
  const swimmingEvent = await prisma.event.create({
    data: {
      id: uuidv4(),
      name: '2026年大学生游泳锦标赛',
      sportType: 'swimming',
      category: 'race',
      startTime: new Date(),
      status: 'upcoming',
      scoreRules: JSON.stringify(swimmingRule),
    },
  });

  const swimmingMatch = await prisma.match.create({
    data: {
      id: uuidv4(),
      eventId: swimmingEvent.id,
      category: 'race',
      sportType: 'swimming',
      homeTeamId: team1.id,
      awayTeamId: team2.id,
      status: 'not_started',
      currentPeriod: 1,
      periodDuration: 0,
      matchTime: '00:00',
      homeScore: 0,
      awayScore: 0,
    },
  });

  // 游泳选手（8条泳道）
  const swimmerNames = ['刘翔宇', '陈建国', '王海涛', '李明阳', '张浩然', '周小龙', '吴俊杰', '郑凯文'];
  const swimmerTeams = ['华东理工', '交通大学', '复旦大学', '同济大学', '华东理工', '交通大学', '复旦大学', '同济大学'];
  for (let lane = 1; lane <= 8; lane++) {
    await prisma.matchParticipant.create({
      data: {
        id: uuidv4(),
        matchId: swimmingMatch.id,
        laneNumber: lane,
        athleteName: swimmerNames[lane - 1],
        teamName: swimmerTeams[lane - 1],
        status: 'pending',
      },
    });
  }

  // 跑步：2026年大学生田径赛
  const runningRule = getSportRule('running');
  const runningEvent = await prisma.event.create({
    data: {
      id: uuidv4(),
      name: '2026年大学生田径赛',
      sportType: 'running',
      category: 'race',
      startTime: new Date(),
      status: 'upcoming',
      scoreRules: JSON.stringify(runningRule),
    },
  });

  const runningMatch = await prisma.match.create({
    data: {
      id: uuidv4(),
      eventId: runningEvent.id,
      category: 'race',
      sportType: 'running',
      homeTeamId: team3.id,
      awayTeamId: team4.id,
      status: 'not_started',
      currentPeriod: 1,
      periodDuration: 0,
      matchTime: '00:00',
      homeScore: 0,
      awayScore: 0,
    },
  });

  const runnerNames = ['赵子龙', '钱学森', '孙武', '李世民', '曹操', '刘备', '关羽', '张飞'];
  const runnerTeams = ['华东理工', '交通大学', '复旦大学', '同济大学', '交通大学', '华东理工', '同济大学', '复旦大学'];
  for (let lane = 1; lane <= 8; lane++) {
    await prisma.matchParticipant.create({
      data: {
        id: uuidv4(),
        matchId: runningMatch.id,
        laneNumber: lane,
        athleteName: runnerNames[lane - 1],
        teamName: runnerTeams[lane - 1],
        status: 'pending',
      },
    });
  }

  console.log('✅ Multi-sport seed data created!');
  console.log(`  🏀 Basketball match: ${basketballMatch.id}`);
  console.log(`  ⚽ Football match: ${footballMatch.id}`);
  console.log(`  🏐 Volleyball match: ${volleyballMatch.id}`);
  console.log(`  🏊 Swimming match: ${swimmingMatch.id}`);
  console.log(`  🏃 Running match: ${runningMatch.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const teams = [
    { name: "Sentinels", slug: "sentinels", region: "Americas" },
    { name: "LOUD", slug: "loud", region: "Americas" },
    { name: "Fnatic", slug: "fnatic", region: "EMEA" },
    { name: "DRX", slug: "drx", region: "Pacific" },
    { name: "NAVI", slug: "navi", region: "EMEA" },
    { name: "Cloud9", slug: "cloud9", region: "Americas" },
    { name: "Paper Rex", slug: "paper-rex", region: "Pacific" },
    { name: "KRÜ Esports", slug: "kru", region: "Americas" },
    { name: "Team Liquid", slug: "team-liquid", region: "EMEA" },
    { name: "Gen.G", slug: "geng", region: "Pacific" },
    { name: "100 Thieves", slug: "100-thieves", region: "Americas" },
    { name: "OpTic Gaming", slug: "optic", region: "Americas" },
    { name: "NRG", slug: "nrg", region: "Americas" },
    { name: "XSET", slug: "xset", region: "Americas" },
    { name: "Leviatan", slug: "leviatan", region: "Americas" },
    { name: "KOI", slug: "koi", region: "EMEA" },
    { name: "Team Heretics", slug: "heretics", region: "EMEA" },
    { name: "Karmine Corp", slug: "karmine-corp", region: "EMEA" },
  ];

  const ct: Record<string, number> = {};
  for (const t of teams) {
    const team = await prisma.team.upsert({ where: { slug: t.slug }, update: t, create: t });
    ct[t.slug] = team.id;
  }

  const players = [
    { nickname: "TenZ", realName: "Tyson Ngo", countryCode: "CA" },
    { nickname: "Aspas", realName: "Erick Santos", countryCode: "BR" },
    { nickname: "Derke", realName: "Nikita Sirmitev", countryCode: "FI" },
    { nickname: "Boaster", realName: "Jake Howlett", countryCode: "GB" },
    { nickname: "Chronicle", realName: "Timofey Khromov", countryCode: "RU" },
    { nickname: "yay", realName: "Jaccob Whiteaker", countryCode: "US" },
    { nickname: "Sacy", realName: "Gustavo Rossi", countryCode: "BR" },
    { nickname: "Less", realName: "Felipe de Loyola", countryCode: "BR" },
    { nickname: "f0rsakeN", realName: "Jason Susanto", countryCode: "ID" },
    { nickname: "Jinggg", realName: "Wang Jing Jie", countryCode: "SG" },
    { nickname: "Crashies", realName: "Austin Roberts", countryCode: "US" },
    { nickname: "Victor", realName: "Victor Wong", countryCode: "US" },
    { nickname: "Marved", realName: "Jimmy Nguyen", countryCode: "CA" },
    { nickname: "zombs", realName: "Jared Gitlin", countryCode: "US" },
    { nickname: "ShahZaM", realName: "Shahzeeb Khan", countryCode: "US" },
    { nickname: "SicK", realName: "Hunter Mims", countryCode: "US" },
    { nickname: "dapr", realName: "Michael Gulino", countryCode: "US" },
    { nickname: "Alfajer", realName: "Emir Ali Beder", countryCode: "TR" },
    { nickname: "Leo", realName: "Leonid Bochok", countryCode: "UA" },
    { nickname: "Saadhak", realName: "Bryan Rossi", countryCode: "AR" },
    { nickname: "pANcada", realName: "Bryan Luna", countryCode: "BR" },
    { nickname: "tuyz", realName: "Arthur Andrade", countryCode: "BR" },
    { nickname: "cauanzin", realName: "Cauan Pereira", countryCode: "BR" },
    { nickname: "MaKo", realName: "Kim Myeong-gwan", countryCode: "KR" },
    { nickname: "Rb", realName: "Kim Su-hyeon", countryCode: "KR" },
    { nickname: "BuZz", realName: "Yu Byung-chul", countryCode: "KR" },
    { nickname: "stax", realName: "Kim Gu-taek", countryCode: "KR" },
    { nickname: "Zekken", realName: "Zachary Patrone", countryCode: "US" },
    { nickname: "nAts", realName: "Ayaz Akhmetshin", countryCode: "RU" },
    { nickname: "Mazino", realName: "Kim Min-cheol", countryCode: "KR" },
    { nickname: "something", realName: "Choi Hwan", countryCode: "KR" },
    { nickname: "s0m", realName: "Sam Oh", countryCode: "US" },
    { nickname: "FNS", realName: "Pujan Mehta", countryCode: "CA" },
    { nickname: "Ardiis", realName: "Ardis Svarenieks", countryCode: "LV" },
    { nickname: "Scream", realName: "Adil Benrlitom", countryCode: "BE" },
    { nickname: "Jamppi", realName: "Elias Olkkonen", countryCode: "FI" },
    { nickname: "Sayf", realName: "Saif Jibraeel", countryCode: "SE" },
    { nickname: "Enzo", realName: "Enzo Mestari", countryCode: "FR" },
    { nickname: "keznit", realName: "Angelo Mori", countryCode: "CL" },
    { nickname: "Kicks", realName: "Kauã Vitor", countryCode: "BR" },
  ];

  const cp: Record<string, number> = {};
  for (const p of players) {
    const pl = await prisma.player.upsert({ where: { nickname: p.nickname }, update: p, create: p });
    cp[p.nickname] = pl.id;
  }

  // Rosters: [player, team, role, startDate, endDate, mapsPlayed]
  const rosters: [string, string, string, string, string | null, number][] = [
    ["TenZ", "sentinels", "duelist", "2021-04-01", null, 150],
    ["zombs", "sentinels", "controller", "2020-04-01", "2022-10-01", 120],
    ["ShahZaM", "sentinels", "sentinel", "2020-04-01", "2022-10-01", 130],
    ["SicK", "sentinels", "initiator", "2020-04-01", "2022-10-01", 110],
    ["dapr", "sentinels", "sentinel", "2020-04-01", "2022-10-01", 130],
    ["Zekken", "sentinels", "duelist", "2023-01-01", null, 80],
    ["Sacy", "sentinels", "initiator", "2023-01-01", null, 80],
    ["Marved", "sentinels", "controller", "2023-01-01", null, 80],
    ["Aspas", "loud", "duelist", "2022-01-01", null, 160],
    ["Saadhak", "loud", "initiator", "2022-01-01", null, 160],
    ["Less", "loud", "sentinel", "2022-01-01", null, 160],
    ["pANcada", "loud", "controller", "2022-01-01", null, 160],
    ["tuyz", "loud", "initiator", "2022-06-01", "2023-08-01", 90],
    ["cauanzin", "loud", "duelist", "2023-08-01", null, 40],
    ["Derke", "fnatic", "duelist", "2021-01-01", null, 180],
    ["Boaster", "fnatic", "initiator", "2020-06-01", null, 200],
    ["Alfajer", "fnatic", "duelist", "2023-01-01", null, 70],
    ["Leo", "fnatic", "sentinel", "2021-06-01", null, 170],
    ["Chronicle", "fnatic", "controller", "2023-01-01", null, 70],
    ["Chronicle", "navi", "sentinel", "2021-01-01", "2022-12-01", 90],
    ["nAts", "navi", "sentinel", "2021-01-01", "2023-01-01", 100],
    ["MaKo", "drx", "controller", "2021-01-01", null, 160],
    ["Rb", "drx", "duelist", "2021-01-01", null, 160],
    ["BuZz", "drx", "duelist", "2021-01-01", null, 160],
    ["stax", "drx", "initiator", "2021-01-01", null, 160],
    ["Mazino", "drx", "sentinel", "2023-01-01", null, 60],
    ["something", "drx", "sentinel", "2021-01-01", "2022-12-01", 100],
    ["f0rsakeN", "paper-rex", "duelist", "2021-06-01", null, 150],
    ["Jinggg", "paper-rex", "duelist", "2021-06-01", null, 150],
    ["something", "paper-rex", "initiator", "2023-01-01", null, 60],
    ["yay", "optic", "duelist", "2021-10-01", "2023-03-01", 120],
    ["Crashies", "optic", "initiator", "2021-10-01", "2023-03-01", 120],
    ["Victor", "optic", "duelist", "2021-10-01", "2023-03-01", 120],
    ["Marved", "optic", "controller", "2021-10-01", "2023-03-01", 120],
    ["FNS", "optic", "sentinel", "2021-10-01", "2023-03-01", 120],
    ["s0m", "nrg", "controller", "2023-04-01", null, 70],
    ["Crashies", "nrg", "initiator", "2023-04-01", null, 70],
    ["Victor", "nrg", "duelist", "2023-04-01", null, 70],
    ["FNS", "nrg", "sentinel", "2023-04-01", null, 70],
    ["Ardiis", "nrg", "duelist", "2023-04-01", null, 70],
    ["yay", "cloud9", "duelist", "2023-03-01", "2023-10-01", 40],
    ["Zekken", "cloud9", "initiator", "2022-06-01", "2022-12-01", 45],
    ["Scream", "team-liquid", "duelist", "2021-01-01", "2023-06-01", 120],
    ["Jamppi", "team-liquid", "sentinel", "2021-01-01", "2023-06-01", 120],
    ["Sayf", "team-liquid", "initiator", "2022-01-01", null, 100],
    ["Enzo", "team-liquid", "duelist", "2023-06-01", null, 50],
    ["Crashies", "100-thieves", "initiator", "2020-06-01", "2021-09-01", 80],
    ["Victor", "100-thieves", "duelist", "2020-06-01", "2021-09-01", 80],
    ["Zekken", "xset", "duelist", "2021-06-01", "2022-05-01", 60],
    ["keznit", "kru", "duelist", "2021-01-01", "2023-06-01", 130],
    ["keznit", "leviatan", "duelist", "2023-06-01", null, 50],
    ["Kicks", "leviatan", "initiator", "2023-06-01", null, 50],
    ["Scream", "koi", "duelist", "2023-08-01", null, 40],
    ["Jamppi", "heretics", "sentinel", "2024-01-01", null, 30],
    ["Enzo", "karmine-corp", "duelist", "2022-01-01", "2023-05-01", 60],
  ];

  for (const [player, team, role, start, end, maps] of rosters) {
    const playerId = cp[player];
    const teamId = ct[team];
    if (!playerId || !teamId) { console.warn(`Skip: ${player} -> ${team}`); continue; }
    await prisma.roster.create({
      data: { playerId, teamId, role, isStandin: false, mapsPlayed: maps, yearStart: new Date(start), yearEnd: end ? new Date(end) : null },
    });
  }

  console.log(`✅ Seed complete: ${Object.keys(cp).length} players, ${Object.keys(ct).length} teams, ${rosters.length} rosters.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

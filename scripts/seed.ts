import './load-env';
import { db } from '../lib/db/client';
import * as s from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  // Reset all tables AND their identity sequences so IDs are deterministic across reseeds
  await db.execute(sql`TRUNCATE
    payroll_lines, payroll_runs, attendance, collections, leave_records,
    requisitions, audit_log, stock_items, replanting, workers, blocks,
    collection_centres, divisions, estates, groups, settings
    RESTART IDENTITY CASCADE`);

  // 1. Groups & estates (fixed, from the proposal)
  const [gA] = await db.insert(s.groups).values({ name: 'Group A' }).returning();
  const [gB] = await db.insert(s.groups).values({ name: 'Group B' }).returning();
  const estateRows = await db.insert(s.estates).values([
    { name: 'Chithalvetty', groupId: gA.id },
    { name: 'Kumaramkudy', groupId: gA.id },
    { name: 'Mullumala', groupId: gB.id },
    { name: 'Cheruppittakkavu', groupId: gB.id },
  ]).returning();

  const classSpec = {
    II:  { standardKg: '18', incentiveRate: '12' },
    III: { standardKg: '15', incentiveRate: '10' },
    IV:  { standardKg: '12', incentiveRate: '8' },
  } as const;

  let checkSeq = 1000;
  for (const est of estateRows) {
    for (let d = 1; d <= 2; d++) {
      const [div] = await db.insert(s.divisions)
        .values({ name: `${est.name} Division ${d}`, estateId: est.id }).returning();
      for (let c = 1; c <= 2; c++) {
        const [cc] = await db.insert(s.collectionCentres)
          .values({ name: `CC ${est.name.slice(0,3)}-${d}${c}`, divisionId: div.id, area: 'Mature' })
          .returning();
        for (const bc of ['II', 'III', 'IV'] as const) {
          await db.insert(s.blocks).values({
            code: `${cc.name}-${bc}`, ccId: cc.id, blockClass: bc,
            standardKg: classSpec[bc].standardKg, incentiveRate: classSpec[bc].incentiveRate,
            treeCount: 350,
          });
        }
        const people = [
          { category: 'Permanent', type: 'Tapper' },
          { category: 'Casual', type: 'Tapper' },
          { category: 'Dependent', type: 'Tapper' },
          { category: 'Permanent', type: 'General' },
        ] as const;
        const firstNames = ['Rajan', 'Suresh', 'Latha', 'Vijayan', 'Ambika', 'Ravi', 'Sunil', 'Geetha', 'Manoj', 'Bindu', 'Anil', 'Sreeja', 'Prakash', 'Reshma', 'Biju', 'Divya'];
        const lastNames = ['Nair', 'Menon', 'Pillai', 'Kurup', 'Das'];
        for (const p of people) {
          checkSeq += 1;
          // A few workers are within ~2 months of retirement (age 58) to demonstrate retirement alerts.
          const nearRetire = checkSeq % 21 === 0;
          const birthYear = nearRetire ? 1968 : 1972 + (checkSeq % 26); // 1972..1997
          const birthMonth = nearRetire ? 8 : ((checkSeq % 12) + 1);
          const dob = `${birthYear}-${String(birthMonth).padStart(2, '0')}-15`;
          const joinYear = 2003 + (checkSeq % 18); // 2003..2020
          const female = checkSeq % 2 === 0;
          const name = `${firstNames[checkSeq % firstNames.length]} ${lastNames[checkSeq % lastNames.length]}`;
          await db.insert(s.workers).values({
            checkRoll: `SFCK-${checkSeq}`,
            name,
            category: p.category, type: p.type,
            gender: female ? 'Female' : 'Male',
            dob, dateOfJoining: `${joinYear}-06-01`,
            mobile: `98${checkSeq}00`, email: null, address: `${est.name}`,
            estateId: est.id, ccId: cc.id,
          });
        }
      }
    }
    await db.insert(s.stockItems).values([
      { estateId: est.id, name: 'Latex', unit: 'kg', balance: '4200' },
      { estateId: est.id, name: 'Scrap', unit: 'kg', balance: '1100' },
      { estateId: est.id, name: 'Ammonia', unit: 'L', balance: '260' },
    ]);
    await db.insert(s.replanting).values([
      { estateId: est.id, blockCode: `${est.name}-RP14`, plantingYear: 2014, areaHa: '5.0',
        surviving: 1600, decayed: 80, vacant: 20, expenditure: '850000', yieldKg: '3200' },
      { estateId: est.id, blockCode: `${est.name}-RP18`, plantingYear: 2018, areaHa: '4.0',
        surviving: 1400, decayed: 60, vacant: 40, expenditure: '620000', yieldKg: '1800' },
      { estateId: est.id, blockCode: `${est.name}-RP21`, plantingYear: 2021, areaHa: '3.5',
        surviving: 1300, decayed: 50, vacant: 30, expenditure: '480000', yieldKg: '0' },
    ]);
  }

  await db.insert(s.settings).values([
    { key: 'retirement_age', value: '58', label: 'Retirement Age' },
    { key: 'working_days', value: '26', label: 'Approved Working Days / Month' },
    { key: 'medical_leave_cap', value: '14', label: 'Medical Leave Cap (days/yr)' },
    { key: 'pf_percent', value: '12', label: 'PF Percentage' },
  ]);

  // ---- Operational data: production collections (incl. prior-year) + attendance ----
  const tappers = await db.select().from(s.workers).where(eq(s.workers.type, 'Tapper'));

  const daysCurrent = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06'];
  const daysPrior   = ['2025-07-01', '2025-07-02', '2025-07-03', '2025-07-04', '2025-07-05', '2025-07-06'];
  const drcFor = (i: number) => (0.40 + ((i % 6) * 0.01)).toFixed(2);

  const collectionRows: (typeof s.collections.$inferInsert)[] = [];
  tappers.forEach((w, i) => {
    daysCurrent.forEach((day, di) => {
      collectionRows.push({
        workerId: w.id, ccId: w.ccId!, day,
        latexKg: String(48 + ((i + di) % 24)), scrapKg: String(4 + ((i + di) % 5)),
        drc: drcFor(i + di), locked: true, slipSentSms: true,
      });
    });
    daysPrior.forEach((day, di) => {
      collectionRows.push({
        workerId: w.id, ccId: w.ccId!, day,
        latexKg: String(38 + ((i + di) % 20)), scrapKg: String(3 + ((i + di) % 4)),
        drc: drcFor(i + di), locked: true, slipSentSms: true,
      });
    });
  });
  for (let i = 0; i < collectionRows.length; i += 100) {
    await db.insert(s.collections).values(collectionRows.slice(i, i + 100));
  }

  // Attendance for one recent day, varied times to demonstrate approval rules
  const allWorkers = await db.select().from(s.workers);
  const attRows: (typeof s.attendance.$inferInsert)[] = [];
  allWorkers.forEach((w, i) => {
    let markedAt = '06:05';
    let status: 'Approved' | 'Pending' | 'Rejected' = 'Approved';
    let isExcess = false;
    if (i % 17 === 0) { markedAt = '06:22'; status = 'Pending'; }          // AM approval queue (6:15-6:30)
    else if (i % 23 === 0) { markedAt = '06:20'; status = 'Approved'; isExcess = true; } // excess -> voucher
    attRows.push({ workerId: w.id, day: '2026-07-06', markedAt, isExcess, status });
  });
  for (let i = 0; i < attRows.length; i += 100) {
    await db.insert(s.attendance).values(attRows.slice(i, i + 100));
  }

  // A few audit-trail entries so the Data Integrity panel is populated on first load
  await db.insert(s.auditLog).values([
    { actorRole: 'am', action: 'attendance-approved', entity: 'attendance:12' },
    { actorRole: 'em', action: 'excess-voucher-created', entity: 'attendance:24' },
    { actorRole: 'am', action: 'correction-approved', entity: 'collection:57' },
    { actorRole: 'am', action: 'factory-dispatch', entity: 'stock:1 qty:150' },
  ]);

  // Summary counts
  const allCcs = await db.select().from(s.collectionCentres);
  const allBlocks = await db.select().from(s.blocks);
  const allStock = await db.select().from(s.stockItems);
  const allReplanting = await db.select().from(s.replanting);
  const allSettings = await db.select().from(s.settings);
  const allCollections = await db.select().from(s.collections);
  const allAttendance = await db.select().from(s.attendance);

  console.log('Seed complete.');
  console.log(
    `Estates: ${estateRows.length}, Workers: ${allWorkers.length}, ` +
    `Collection Centres: ${allCcs.length}, Blocks: ${allBlocks.length}, ` +
    `Stock Items: ${allStock.length}, Replanting: ${allReplanting.length}, ` +
    `Settings: ${allSettings.length}`
  );
  console.log(`Collections: ${allCollections.length}, Attendance: ${allAttendance.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

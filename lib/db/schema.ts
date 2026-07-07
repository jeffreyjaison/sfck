// lib/db/schema.ts
import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, date, pgEnum,
} from 'drizzle-orm/pg-core';

export const workerCategory = pgEnum('worker_category', ['Dependent', 'Casual', 'Permanent']);
export const workerType = pgEnum('worker_type', ['Tapper', 'General']);
export const areaClass = pgEnum('area_class', ['Mature', 'Immature', 'Replanting']);
export const blockClass = pgEnum('block_class', ['II', 'III', 'IV']);
export const approvalStatus = pgEnum('approval_status', ['Pending', 'Approved', 'Rejected', 'Locked']);

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const estates = pgTable('estates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  groupId: integer('group_id').references(() => groups.id).notNull(),
});

export const divisions = pgTable('divisions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
});

export const collectionCentres = pgTable('collection_centres', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  divisionId: integer('division_id').references(() => divisions.id).notNull(),
  area: areaClass('area').notNull().default('Mature'),
});

export const blocks = pgTable('blocks', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  ccId: integer('cc_id').references(() => collectionCentres.id).notNull(),
  blockClass: blockClass('block_class').notNull(),
  standardKg: numeric('standard_kg').notNull(),
  incentiveRate: numeric('incentive_rate').notNull(),
  treeCount: integer('tree_count').notNull().default(350),
});

export const workers = pgTable('workers', {
  id: serial('id').primaryKey(),
  checkRoll: text('check_roll').notNull().unique(),
  name: text('name').notNull(),
  category: workerCategory('category').notNull(),
  type: workerType('type').notNull(),
  gender: text('gender').notNull(),
  dob: date('dob').notNull(),
  dateOfJoining: date('date_of_joining').notNull(),
  mobile: text('mobile'),
  email: text('email'),
  address: text('address'),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  ccId: integer('cc_id').references(() => collectionCentres.id),
  active: boolean('active').notNull().default(true),
  retired: boolean('retired').notNull().default(false),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  day: date('day').notNull(),
  markedAt: text('marked_at').notNull(),
  isExcess: boolean('is_excess').notNull().default(false),
  status: approvalStatus('status').notNull().default('Pending'),
});

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  ccId: integer('cc_id').references(() => collectionCentres.id).notNull(),
  day: date('day').notNull(),
  latexKg: numeric('latex_kg').notNull().default('0'),
  scrapKg: numeric('scrap_kg').notNull().default('0'),
  drc: numeric('drc'),
  locked: boolean('locked').notNull().default(true),
  slipSentSms: boolean('slip_sent_sms').notNull().default(true),
});

export const payrollRuns = pgTable('payroll_runs', {
  id: serial('id').primaryKey(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  workingDays: integer('working_days').notNull().default(26),
  status: text('status').notNull().default('Draft'),
});

export const payrollLines = pgTable('payroll_lines', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').references(() => payrollRuns.id).notNull(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  grossWage: numeric('gross_wage').notNull(),
  incentive: numeric('incentive').notNull().default('0'),
  weightage: numeric('weightage').notNull().default('0'),
  washing: numeric('washing').notNull().default('0'),
  pf: numeric('pf').notNull().default('0'),
  otherRecovery: numeric('other_recovery').notNull().default('0'),
  netPay: numeric('net_pay').notNull(),
});

export const leaveRecords = pgTable('leave_records', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  kind: text('kind').notNull(),
  days: integer('days').notNull(),
  year: integer('year').notNull(),
});

export const stockItems = pgTable('stock_items', {
  id: serial('id').primaryKey(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  balance: numeric('balance').notNull().default('0'),
});

export const requisitions = pgTable('requisitions', {
  id: serial('id').primaryKey(),
  ccId: integer('cc_id').references(() => collectionCentres.id).notNull(),
  item: text('item').notNull(),
  qty: integer('qty').notNull(),
  status: approvalStatus('status').notNull().default('Pending'),
});

export const replanting = pgTable('replanting', {
  id: serial('id').primaryKey(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  blockCode: text('block_code').notNull(),
  plantingYear: integer('planting_year').notNull(),
  areaHa: numeric('area_ha').notNull(),
  surviving: integer('surviving').notNull().default(0),
  decayed: integer('decayed').notNull().default(0),
  vacant: integer('vacant').notNull().default(0),
  expenditure: numeric('expenditure').notNull().default('0'),
  yieldKg: numeric('yield_kg').notNull().default('0'),
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  at: timestamp('at').notNull().defaultNow(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  label: text('label').notNull(),
});

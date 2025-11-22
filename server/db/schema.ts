import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'maker', 'checker', 'admin'
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLogin: timestamp('last_login'),
});

// Vendors table
export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  address: text('address').notNull(),
  vat: decimal('vat', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Items table
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  specification: text('specification').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  isVatable: boolean('is_vatable').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Comparisons table
export const comparisons = pgTable('comparisons', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestNumber: varchar('request_number', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft', 'submitted', 'approved', 'rejected'
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  generalComments: text('general_comments'),
  purpose: varchar('purpose', { length: 255 }),
  version: integer('version').notNull().default(1),
  originalId: uuid('original_id'),
});

// Comparison rows table
export const comparisonRows = pgTable('comparison_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  comparisonId: uuid('comparison_id').notNull().references(() => comparisons.id, { onDelete: 'cascade' }),
  srl: integer('srl').notNull(),
  itemId: uuid('item_id').notNull().references(() => items.id),
  description: text('description').notNull(),
  qty: decimal('qty', { precision: 10, scale: 2 }).notNull(),
  uom: varchar('uom', { length: 50 }).notNull(),
  quantities: jsonb('quantities').$type<number[]>().notNull(),
  prices: jsonb('prices').$type<number[]>().notNull(),
  vendor1UnitPrice: decimal('vendor1_unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor1Vat: decimal('vendor1_vat', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor1Total: decimal('vendor1_total', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor2UnitPrice: decimal('vendor2_unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor2Vat: decimal('vendor2_vat', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor2Total: decimal('vendor2_total', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor3UnitPrice: decimal('vendor3_unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor3Vat: decimal('vendor3_vat', { precision: 10, scale: 2 }).notNull().default('0'),
  vendor3Total: decimal('vendor3_total', { precision: 10, scale: 2 }).notNull().default('0'),
  selectedVendorIndex: integer('selected_vendor_index'),
  remarks: text('remarks'),
  comment: text('comment'),
});

// Comparison vendors table (junction table for many-to-many relationship)
export const comparisonVendors = pgTable('comparison_vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  comparisonId: uuid('comparison_id').notNull().references(() => comparisons.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  position: integer('position').notNull(), // 1, 2, or 3 for vendor1, vendor2, vendor3
});

// Attachments table
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  size: integer('size').notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  fileUrl: text('file_url'), // For storing file path or URL
  comparisonId: uuid('comparison_id').references(() => comparisons.id, { onDelete: 'cascade' }),
});

// Settings table
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyAddress: text('company_address').notNull(),
  companyPhone: varchar('company_phone', { length: 50 }).notNull(),
  companyEmail: varchar('company_email', { length: 255 }).notNull(),
  defaultVat: decimal('default_vat', { precision: 5, scale: 2 }).notNull().default('0'),
  checkerSignature: text('checker_signature'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  comparisons: many(comparisons),
  attachments: many(attachments),
}));

export const comparisonsRelations = relations(comparisons, ({ one, many }) => ({
  creator: one(users, {
    fields: [comparisons.createdBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [comparisons.reviewedBy],
    references: [users.id],
  }),
  rows: many(comparisonRows),
  vendors: many(comparisonVendors),
  attachments: many(attachments),
}));

export const comparisonRowsRelations = relations(comparisonRows, ({ one }) => ({
  comparison: one(comparisons, {
    fields: [comparisonRows.comparisonId],
    references: [comparisons.id],
  }),
  item: one(items, {
    fields: [comparisonRows.itemId],
    references: [items.id],
  }),
}));

export const comparisonVendorsRelations = relations(comparisonVendors, ({ one }) => ({
  comparison: one(comparisons, {
    fields: [comparisonVendors.comparisonId],
    references: [comparisons.id],
  }),
  vendor: one(vendors, {
    fields: [comparisonVendors.vendorId],
    references: [vendors.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploader: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
  comparison: one(comparisons, {
    fields: [attachments.comparisonId],
    references: [comparisons.id],
  }),
}));

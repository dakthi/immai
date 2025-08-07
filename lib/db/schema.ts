import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  decimal,
  integer,
} from 'drizzle-orm/pg-core';
// For now, use text column for vector storage until we can properly set up pgvector
// import { vector } from 'pgvector';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  name: varchar('name', { length: 100 }),
  role: varchar('role', { enum: ['user', 'paiduser', 'admin'] }).notNull().default('user'),
  emailVerified: boolean('emailVerified').notNull().default(false),
  resetToken: varchar('resetToken', { length: 255 }),
  resetTokenExpiry: timestamp('resetTokenExpiry'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  stripeCustomerId: varchar('stripeCustomerId', { length: 255 }),
  subscriptionStatus: varchar('subscriptionStatus', { 
    enum: ['active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid'] 
  }),
  subscriptionId: varchar('subscriptionId', { length: 255 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

export const cmsContent = pgTable('CMSContent', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  type: varchar('type', { enum: ['prompt', 'template', 'document', 'config'] })
    .notNull()
    .default('document'),
  category: varchar('category', { length: 100 }),
  tags: json('tags').$type<string[]>().default([]),
  embedding: text('embedding'), // JSON string of vector array
  isActive: boolean('isActive').notNull().default(true),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type CMSContent = InferSelectModel<typeof cmsContent>;

// New tables for document management and payment system
export const documentLibrary = pgTable('DocumentLibrary', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  fileName: varchar('fileName', { length: 255 }).notNull(),
  filePath: text('filePath').notNull(),
  fileSize: integer('fileSize').notNull(),
  fileType: varchar('fileType', { length: 50 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0.00'),
  isFree: boolean('isFree').notNull().default(true),
  category: varchar('category', { length: 100 }),
  tags: json('tags').$type<string[]>().default([]),
  downloadCount: integer('downloadCount').notNull().default(0),
  isActive: boolean('isActive').notNull().default(true),
  analyzedContent: json('analyzedContent').$type<{
    text?: string;
    keywords?: string[];
    summary?: string;
    metadata?: Record<string, any>;
  }>(),
  uploadedBy: uuid('uploadedBy')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type DocumentLibrary = InferSelectModel<typeof documentLibrary>;

export const payment = pgTable('Payment', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  documentId: uuid('documentId')
    .references(() => documentLibrary.id),
  paymentType: varchar('paymentType', { enum: ['document', 'package'] }).notNull(),
  stripePaymentIntentId: varchar('stripePaymentIntentId', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: varchar('status', { 
    enum: ['pending', 'completed', 'failed', 'refunded'] 
  }).notNull().default('pending'),
  paymentDate: timestamp('paymentDate'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Payment = InferSelectModel<typeof payment>;

export const userDocumentAccess = pgTable('UserDocumentAccess', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  documentId: uuid('documentId')
    .notNull()
    .references(() => documentLibrary.id),
  paymentId: uuid('paymentId')
    .references(() => payment.id),
  accessType: varchar('accessType', { enum: ['purchased', 'free', 'admin'] }).notNull(),
  downloadCount: integer('downloadCount').notNull().default(0),
  lastAccessedAt: timestamp('lastAccessedAt'),
  grantedAt: timestamp('grantedAt').notNull().defaultNow(),
});

export type UserDocumentAccess = InferSelectModel<typeof userDocumentAccess>;

export const downloadHistory = pgTable('DownloadHistory', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  documentId: uuid('documentId')
    .notNull()
    .references(() => documentLibrary.id),
  accessId: uuid('accessId')
    .notNull()
    .references(() => userDocumentAccess.id),
  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: text('userAgent'),
  downloadedAt: timestamp('downloadedAt').notNull().defaultNow(),
});

export type DownloadHistory = InferSelectModel<typeof downloadHistory>;


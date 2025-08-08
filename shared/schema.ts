import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("superadmin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(), // 'device_discovery_rate', 'mrr', 'active_homes', 'churn_rate'
  value: text("value").notNull(),
  previousValue: text("previous_value"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // Additional context data
});

export const systemHealth = pgTable("system_health", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: text("service").notNull(), // 'api', 'database', 'realtime', 'external_services'
  status: text("status").notNull(), // 'operational', 'degraded', 'down'
  responseTime: text("response_time"),
  uptime: text("uptime"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const criticalAlerts = pgTable("critical_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'critical', 'warning', 'info'
  title: text("title").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(), // Which system generated the alert
  isActive: boolean("is_active").notNull().default(true),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  dismissedAt: timestamp("dismissed_at"),
});

export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // 'system_event', 'user_action', 'emergency_control'
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // 'info', 'warning', 'critical'
  userId: varchar("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const emergencySettings = pgTable("emergency_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingName: text("setting_name").notNull().unique(), // 'content_kill_switch', 'maintenance_mode', 'sound_alerts'
  isEnabled: boolean("is_enabled").notNull().default(false),
  lastModifiedBy: varchar("last_modified_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at").defaultNow(),
});

// Customer homes (renamed from existing aggregate table)
export const customerHomes = pgTable("customer_homes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  primaryAdminId: varchar("primary_admin_id").notNull().references(() => users.id),
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'suspended'
  createdAt: timestamp("created_at").defaultNow(),
});

export const userHomes = pgTable("user_homes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  homeId: varchar("home_id").notNull().references(() => customerHomes.id),
  role: varchar("role", { length: 50 }).notNull(), // 'primary_admin', 'secondary_admin', 'property_manager', 'guest'
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Device Categories Table
export const deviceCategories = pgTable("device_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  isCustom: boolean("is_custom").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Device Brands Table
export const deviceBrands = pgTable("device_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => deviceCategories.id),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  website: varchar("website", { length: 255 }),
  supportUrl: varchar("support_url", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Device Models Table
export const deviceModels = pgTable("device_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => deviceBrands.id),
  name: varchar("name", { length: 150 }).notNull(),
  displayName: varchar("display_name", { length: 150 }),
  modelNumber: varchar("model_number", { length: 100 }),
  description: text("description"),
  specifications: jsonb("specifications").default({}),
  manualUrl: varchar("manual_url", { length: 500 }),
  supportUrl: varchar("support_url", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Updated Devices Table
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeId: varchar("home_id").notNull().references(() => customerHomes.id),
  categoryId: varchar("category_id").references(() => deviceCategories.id),
  brandId: varchar("brand_id").references(() => deviceBrands.id),
  modelId: varchar("model_id").references(() => deviceModels.id),
  name: varchar("name", { length: 200 }).notNull(),
  customCategory: varchar("custom_category", { length: 100 }), // For user-defined categories
  customBrand: varchar("custom_brand", { length: 100 }), // For unlisted brands
  customModel: varchar("custom_model", { length: 100 }), // For unlisted models
  roomLocation: varchar("room_location", { length: 100 }),
  discoveryMethod: varchar("discovery_method", { length: 50 }), // 'wifi_scan', 'manual', 'barcode', 'visual'
  status: varchar("status", { length: 20 }).notNull().default("active"),
  metadata: jsonb("metadata").default({}),
  notes: text("notes"), // User notes about the device
  purchaseDate: date("purchase_date"),
  warrantyExpiry: date("warranty_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deviceDocumentation = pgTable("device_documentation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id),
  source: varchar("source", { length: 50 }).notNull(), // 'official_manual', 'user_notes', 'ai_generated'
  content: text("content"),
  contentType: varchar("content_type", { length: 50 }), // 'manual', 'quick_start', 'troubleshooting'
  createdAt: timestamp("created_at").defaultNow(),
});

// Legacy aggregate homes table for admin dashboard (keep existing data)
export const homes = pgTable("homes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeIdentifier: text("home_identifier").notNull().unique(), // Anonymized identifier
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'suspended'
  planType: text("plan_type").notNull(),
  mrr: decimal("mrr", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertSystemHealthSchema = createInsertSchema(systemHealth).omit({
  id: true,
  timestamp: true,
});

export const insertCriticalAlertSchema = createInsertSchema(criticalAlerts).omit({
  id: true,
  createdAt: true,
  dismissedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

export const insertEmergencySettingSchema = createInsertSchema(emergencySettings).omit({
  id: true,
  lastModifiedAt: true,
});

// Customer schema inserts
export const insertCustomerHomeSchema = createInsertSchema(customerHomes).omit({
  id: true,
  createdAt: true,
});

export const insertUserHomeSchema = createInsertSchema(userHomes).omit({
  id: true,
  joinedAt: true,
});

// New device-related schemas
export const insertDeviceCategorySchema = createInsertSchema(deviceCategories).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceBrandSchema = createInsertSchema(deviceBrands).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceModelSchema = createInsertSchema(deviceModels).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceDocumentationSchema = createInsertSchema(deviceDocumentation).omit({
  id: true,
  createdAt: true,
});

// Legacy admin schema
export const insertHomeSchema = createInsertSchema(homes).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemHealth = typeof systemHealth.$inferSelect;
export type InsertSystemHealth = z.infer<typeof insertSystemHealthSchema>;
export type CriticalAlert = typeof criticalAlerts.$inferSelect;
export type InsertCriticalAlert = z.infer<typeof insertCriticalAlertSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type EmergencySetting = typeof emergencySettings.$inferSelect;
export type InsertEmergencySetting = z.infer<typeof insertEmergencySettingSchema>;
export type Home = typeof homes.$inferSelect;
export type InsertHome = z.infer<typeof insertHomeSchema>;

// Customer types
export type CustomerHome = typeof customerHomes.$inferSelect;
export type InsertCustomerHome = z.infer<typeof insertCustomerHomeSchema>;
export type UserHome = typeof userHomes.$inferSelect;
export type InsertUserHome = z.infer<typeof insertUserHomeSchema>;
// Device taxonomy types
export type DeviceCategory = typeof deviceCategories.$inferSelect;
export type InsertDeviceCategory = z.infer<typeof insertDeviceCategorySchema>;
export type DeviceBrand = typeof deviceBrands.$inferSelect;
export type InsertDeviceBrand = z.infer<typeof insertDeviceBrandSchema>;
export type DeviceModel = typeof deviceModels.$inferSelect;
export type InsertDeviceModel = z.infer<typeof insertDeviceModelSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type DeviceDocumentation = typeof deviceDocumentation.$inferSelect;
export type InsertDeviceDocumentation = z.infer<typeof insertDeviceDocumentationSchema>;

// New emergency and AI chat tables
export const emergencyAlerts = pgTable('emergency_alerts', {
  id: text('id').primaryKey(),
  homeId: text('home_id').references(() => customerHomes.id).notNull(),
  message: text('message').notNull(),
  location: text('location'),
  urgency: text('urgency').notNull().default('medium'), // low, medium, high, critical
  guestContact: text('guest_contact'),
  status: text('status').notNull().default('active'), // active, acknowledged, resolved
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  homeId: text('home_id').references(() => customerHomes.id).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  confidence: text('confidence'),
  context: json('context').default({}),
  sources: json('sources').default([]),
  followUpSuggestions: json('follow_up_suggestions').default([]),
  rating: integer('rating'), // 1-5 stars
  createdAt: timestamp('created_at').defaultNow(),
});

// Additional insert schemas
export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true,
  acknowledgedAt: true,
  resolvedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Additional types
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

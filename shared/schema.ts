import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
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

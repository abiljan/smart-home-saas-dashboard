import { 
  type User, 
  type InsertUser,
  type SystemMetric,
  type InsertSystemMetric,
  type SystemHealth,
  type InsertSystemHealth,
  type CriticalAlert,
  type InsertCriticalAlert,
  type ActivityLog,
  type InsertActivityLog,
  type EmergencySetting,
  type InsertEmergencySetting,
  type Home,
  type InsertHome,
  users,
  systemMetrics,
  systemHealth,
  criticalAlerts,
  activityLog,
  emergencySettings,
  homes
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { desc, eq } from "drizzle-orm";

// Database is currently disabled due to connection issues
// Using in-memory storage as fallback
let db: any = null;
console.log("Using in-memory storage for dashboard data");

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // System Metrics
  getSystemMetrics(): Promise<SystemMetric[]>;
  getSystemMetricByType(type: string): Promise<SystemMetric | undefined>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  updateSystemMetric(id: string, metric: Partial<SystemMetric>): Promise<SystemMetric | undefined>;

  // System Health
  getSystemHealth(): Promise<SystemHealth[]>;
  getSystemHealthByService(service: string): Promise<SystemHealth | undefined>;
  createSystemHealth(health: InsertSystemHealth): Promise<SystemHealth>;
  updateSystemHealth(id: string, health: Partial<SystemHealth>): Promise<SystemHealth | undefined>;

  // Critical Alerts
  getCriticalAlerts(): Promise<CriticalAlert[]>;
  getActiveCriticalAlerts(): Promise<CriticalAlert[]>;
  createCriticalAlert(alert: InsertCriticalAlert): Promise<CriticalAlert>;
  dismissCriticalAlert(id: string): Promise<CriticalAlert | undefined>;

  // Activity Log
  getActivityLog(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Emergency Settings
  getEmergencySettings(): Promise<EmergencySetting[]>;
  getEmergencySettingByName(name: string): Promise<EmergencySetting | undefined>;
  updateEmergencySetting(name: string, setting: Partial<EmergencySetting>): Promise<EmergencySetting | undefined>;

  // Homes
  getHomes(): Promise<Home[]>;
  getActiveHomesCount(): Promise<number>;
  createHome(home: InsertHome): Promise<Home>;
}

export class DatabaseStorage implements IStorage {
  private memStorage: Map<string, any> = new Map();
  private useDatabase: boolean = false;

  constructor() {
    this.useDatabase = false; // Force memory storage for now
    this.initMemoryStorage();
    this.initializeMemoryData();
  }

  private initMemoryStorage() {
    // Initialize in-memory storage as fallback
    this.memStorage.set('users', new Map());
    this.memStorage.set('systemMetrics', new Map());
    this.memStorage.set('systemHealth', new Map());
    this.memStorage.set('criticalAlerts', new Map());
    this.memStorage.set('activityLog', []);
    this.memStorage.set('emergencySettings', new Map());
    this.memStorage.set('homes', new Map());
  }

  private initializeMemoryData() {
    // Create default admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "password",
      role: "superadmin",
      createdAt: new Date(),
    };
    this.memStorage.get('users').set(adminUser.id, adminUser);

    // Initialize emergency settings
    const emergencySettingsData = [
      { settingName: "content_kill_switch", isEnabled: false, lastModifiedBy: adminUser.id },
      { settingName: "maintenance_mode", isEnabled: false, lastModifiedBy: adminUser.id },
      { settingName: "sound_alerts", isEnabled: true, lastModifiedBy: adminUser.id },
    ];

    emergencySettingsData.forEach(data => {
      const setting: EmergencySetting = {
        id: randomUUID(),
        settingName: data.settingName,
        isEnabled: data.isEnabled,
        lastModifiedBy: data.lastModifiedBy,
        lastModifiedAt: new Date(),
      };
      this.memStorage.get('emergencySettings').set(data.settingName, setting);
    });

    // Initialize system health
    const healthServicesData = [
      { service: "api", status: "operational", responseTime: "1.2s", uptime: "99.8%", details: {} },
      { service: "database", status: "operational", responseTime: "45ms", uptime: "99.9%", details: {} },
      { service: "realtime", status: "operational", responseTime: "23ms", uptime: "99.7%", details: { connections: 847, messagesPerSec: 23 } },
      { service: "external_services", status: "degraded", responseTime: "2.1s", uptime: "98.5%", details: {} },
    ];

    healthServicesData.forEach(data => {
      const health: SystemHealth = {
        id: randomUUID(),
        service: data.service,
        status: data.status,
        responseTime: data.responseTime,
        uptime: data.uptime,
        details: data.details,
        timestamp: new Date(),
      };
      this.memStorage.get('systemHealth').set(data.service, health);
    });

    // Initialize system metrics
    const metricsData = [
      { metricType: "device_discovery_rate", value: "87.3", previousValue: "90.0", metadata: {} },
      { metricType: "mrr", value: "47892", previousValue: "42650", metadata: {} },
      { metricType: "active_homes", value: "1247", previousValue: "1224", metadata: {} },
      { metricType: "churn_rate", value: "2.1", previousValue: "2.4", metadata: {} },
    ];

    metricsData.forEach(data => {
      const metric: SystemMetric = {
        id: randomUUID(),
        metricType: data.metricType,
        value: data.value,
        previousValue: data.previousValue,
        metadata: data.metadata,
        timestamp: new Date(),
      };
      this.memStorage.get('systemMetrics').set(data.metricType, metric);
    });

    // Add some sample activity logs
    const activityLogs = [
      {
        id: randomUUID(),
        eventType: "system_alert",
        title: "Device Discovery Rate Dropped",
        description: "Device discovery rate fell below 90% threshold",
        severity: "warning",
        metadata: {},
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        id: randomUUID(),
        eventType: "user_action",
        title: "Emergency Setting Updated",
        description: "Content kill switch was enabled by admin",
        severity: "critical",
        metadata: {},
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        id: randomUUID(),
        eventType: "system_info",
        title: "System Health Check",
        description: "All services are operational",
        severity: "info",
        metadata: {},
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      }
    ];

    this.memStorage.set('activityLog', activityLogs);
  }

  private async initializeDefaultData() {
    try {
      // Check if DATABASE_URL is configured
      if (!process.env.DATABASE_URL) {
        console.warn("DATABASE_URL not configured, using test data");
        return;
      }

      // Test database connection first
      const testQuery = await db.select().from(users).limit(1);
      
      // Check if admin user exists
      const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
      
      if (existingAdmin.length === 0) {
        // Create default admin user
        const [adminUser] = await db.insert(users).values({
          username: "admin",
          password: "password", // In production, this would be hashed
          role: "superadmin",
        }).returning();

        // Initialize emergency settings
        const emergencySettingsData = [
          { settingName: "content_kill_switch", isEnabled: false, lastModifiedBy: adminUser.id },
          { settingName: "maintenance_mode", isEnabled: false, lastModifiedBy: adminUser.id },
          { settingName: "sound_alerts", isEnabled: true, lastModifiedBy: adminUser.id },
        ];

        await db.insert(emergencySettings).values(emergencySettingsData);

        // Initialize system health
        const healthServicesData = [
          { service: "api", status: "operational", responseTime: "1.2s", uptime: "99.8%", details: {} },
          { service: "database", status: "operational", responseTime: "45ms", uptime: "99.9%", details: {} },
          { service: "realtime", status: "operational", responseTime: "23ms", uptime: "99.7%", details: {} },
          { service: "external_services", status: "degraded", responseTime: "2.1s", uptime: "98.5%", details: {} },
        ];

        await db.insert(systemHealth).values(healthServicesData);

        // Initialize system metrics
        const metricsData = [
          { metricType: "device_discovery_rate", value: "87.3", previousValue: "90.0", metadata: {} },
          { metricType: "mrr", value: "47892", previousValue: "42650", metadata: {} },
          { metricType: "active_homes", value: "1247", previousValue: "1224", metadata: {} },
          { metricType: "churn_rate", value: "2.1", previousValue: "2.4", metadata: {} },
        ];

        await db.insert(systemMetrics).values(metricsData);
      }
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    if (!this.useDatabase) {
      return this.memStorage.get('users').get(id);
    }
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('users').values()).find((user: User) => user.username === username);
    }
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "superadmin",
      createdAt: new Date(),
    };
    
    if (!this.useDatabase) {
      this.memStorage.get('users').set(id, user);
      return user;
    }
    const [dbUser] = await db.insert(users).values(insertUser).returning();
    return dbUser;
  }

  // System Metrics methods
  async getSystemMetrics(): Promise<SystemMetric[]> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('systemMetrics').values());
    }
    return await db.select().from(systemMetrics);
  }

  async getSystemMetricByType(type: string): Promise<SystemMetric | undefined> {
    if (!this.useDatabase) {
      return this.memStorage.get('systemMetrics').get(type);
    }
    const result = await db.select().from(systemMetrics).where(eq(systemMetrics.metricType, type)).limit(1);
    return result[0];
  }

  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    const id = randomUUID();
    const metric: SystemMetric = {
      ...insertMetric,
      id,
      metadata: insertMetric.metadata || {},
      timestamp: new Date(),
    };

    if (!this.useDatabase) {
      this.memStorage.get('systemMetrics').set(insertMetric.metricType, metric);
      return metric;
    }
    const [dbMetric] = await db.insert(systemMetrics).values(insertMetric).returning();
    return dbMetric;
  }

  async updateSystemMetric(id: string, updates: Partial<SystemMetric>): Promise<SystemMetric | undefined> {
    if (!this.useDatabase) {
      const metric = Array.from(this.memStorage.get('systemMetrics').values()).find((m: SystemMetric) => m.id === id);
      if (metric) {
        const updated = { ...metric, ...updates };
        this.memStorage.get('systemMetrics').set(metric.metricType, updated);
        return updated;
      }
      return undefined;
    }
    const result = await db.update(systemMetrics).set(updates).where(eq(systemMetrics.id, id)).returning();
    return result[0];
  }

  // System Health methods
  async getSystemHealth(): Promise<SystemHealth[]> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('systemHealth').values());
    }
    return await db.select().from(systemHealth);
  }

  async getSystemHealthByService(service: string): Promise<SystemHealth | undefined> {
    if (!this.useDatabase) {
      return this.memStorage.get('systemHealth').get(service);
    }
    const result = await db.select().from(systemHealth).where(eq(systemHealth.service, service)).limit(1);
    return result[0];
  }

  async createSystemHealth(insertHealth: InsertSystemHealth): Promise<SystemHealth> {
    const id = randomUUID();
    const health: SystemHealth = {
      ...insertHealth,
      id,
      details: insertHealth.details || {},
      timestamp: new Date(),
    };

    if (!this.useDatabase) {
      this.memStorage.get('systemHealth').set(insertHealth.service, health);
      return health;
    }
    const [dbHealth] = await db.insert(systemHealth).values(insertHealth).returning();
    return dbHealth;
  }

  async updateSystemHealth(id: string, updates: Partial<SystemHealth>): Promise<SystemHealth | undefined> {
    if (!this.useDatabase) {
      const health = Array.from(this.memStorage.get('systemHealth').values()).find((h: SystemHealth) => h.id === id);
      if (health) {
        const updated = { ...health, ...updates };
        this.memStorage.get('systemHealth').set(health.service, updated);
        return updated;
      }
      return undefined;
    }
    const result = await db.update(systemHealth).set(updates).where(eq(systemHealth.id, id)).returning();
    return result[0];
  }

  // Critical Alerts methods
  async getCriticalAlerts(): Promise<CriticalAlert[]> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('criticalAlerts').values())
        .sort((a: CriticalAlert, b: CriticalAlert) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    return await db.select().from(criticalAlerts).orderBy(desc(criticalAlerts.createdAt));
  }

  async getActiveCriticalAlerts(): Promise<CriticalAlert[]> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('criticalAlerts').values())
        .filter((alert: CriticalAlert) => alert.isActive && !alert.isDismissed)
        .sort((a: CriticalAlert, b: CriticalAlert) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    return await db.select().from(criticalAlerts)
      .where(eq(criticalAlerts.isActive, true))
      .orderBy(desc(criticalAlerts.createdAt));
  }

  async createCriticalAlert(insertAlert: InsertCriticalAlert): Promise<CriticalAlert> {
    const id = randomUUID();
    const alert: CriticalAlert = {
      ...insertAlert,
      id,
      isActive: insertAlert.isActive ?? true,
      isDismissed: insertAlert.isDismissed ?? false,
      metadata: insertAlert.metadata || {},
      createdAt: new Date(),
      dismissedAt: null,
    };

    if (!this.useDatabase) {
      this.memStorage.get('criticalAlerts').set(id, alert);
      return alert;
    }
    const [dbAlert] = await db.insert(criticalAlerts).values(insertAlert).returning();
    return dbAlert;
  }

  async dismissCriticalAlert(id: string): Promise<CriticalAlert | undefined> {
    if (!this.useDatabase) {
      const alert = this.memStorage.get('criticalAlerts').get(id);
      if (alert) {
        const updated = { 
          ...alert, 
          isDismissed: true, 
          dismissedAt: new Date() 
        };
        this.memStorage.get('criticalAlerts').set(id, updated);
        return updated;
      }
      return undefined;
    }
    const result = await db.update(criticalAlerts)
      .set({ isDismissed: true, dismissedAt: new Date() })
      .where(eq(criticalAlerts.id, id))
      .returning();
    return result[0];
  }

  // Activity Log methods
  async getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
    if (!this.useDatabase) {
      return this.memStorage.get('activityLog')
        .sort((a: ActivityLog, b: ActivityLog) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
        .slice(0, limit);
    }
    return await db.select().from(activityLog).orderBy(desc(activityLog.timestamp)).limit(limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      ...insertLog,
      id,
      metadata: insertLog.metadata || {},
      timestamp: new Date(),
    };

    if (!this.useDatabase) {
      this.memStorage.get('activityLog').push(log);
      return log;
    }
    const [dbLog] = await db.insert(activityLog).values(insertLog).returning();
    return dbLog;
  }

  // Emergency Settings methods
  async getEmergencySettings(): Promise<EmergencySetting[]> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('emergencySettings').values());
    }
    return await db.select().from(emergencySettings);
  }

  async getEmergencySettingByName(name: string): Promise<EmergencySetting | undefined> {
    if (!this.useDatabase) {
      return this.memStorage.get('emergencySettings').get(name);
    }
    const result = await db.select().from(emergencySettings).where(eq(emergencySettings.settingName, name)).limit(1);
    return result[0];
  }

  async updateEmergencySetting(name: string, updates: Partial<EmergencySetting>): Promise<EmergencySetting | undefined> {
    if (!this.useDatabase) {
      const setting = this.memStorage.get('emergencySettings').get(name);
      if (setting) {
        const updated = { 
          ...setting, 
          ...updates, 
          lastModifiedAt: new Date() 
        };
        this.memStorage.get('emergencySettings').set(name, updated);
        return updated;
      }
      return undefined;
    }
    const result = await db.update(emergencySettings)
      .set({ ...updates, lastModifiedAt: new Date() })
      .where(eq(emergencySettings.settingName, name))
      .returning();
    return result[0];
  }

  // Homes methods
  async getHomes(): Promise<Home[]> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('homes').values());
    }
    return await db.select().from(homes);
  }

  async getActiveHomesCount(): Promise<number> {
    if (!this.useDatabase) {
      return Array.from(this.memStorage.get('homes').values()).filter((home: Home) => home.status === "active").length;
    }
    const result = await db.select().from(homes).where(eq(homes.status, "active"));
    return result.length;
  }

  async createHome(insertHome: InsertHome): Promise<Home> {
    const id = randomUUID();
    const home: Home = {
      ...insertHome,
      id,
      status: insertHome.status || "active",
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    if (!this.useDatabase) {
      this.memStorage.get('homes').set(id, home);
      return home;
    }
    const [dbHome] = await db.insert(homes).values(insertHome).returning();
    return dbHome;
  }
}

export const storage = new DatabaseStorage();

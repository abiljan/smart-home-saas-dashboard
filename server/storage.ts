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
  type InsertHome
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private systemMetrics: Map<string, SystemMetric>;
  private systemHealth: Map<string, SystemHealth>;
  private criticalAlerts: Map<string, CriticalAlert>;
  private activityLog: ActivityLog[];
  private emergencySettings: Map<string, EmergencySetting>;
  private homes: Map<string, Home>;

  constructor() {
    this.users = new Map();
    this.systemMetrics = new Map();
    this.systemHealth = new Map();
    this.criticalAlerts = new Map();
    this.activityLog = [];
    this.emergencySettings = new Map();
    this.homes = new Map();

    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "password", // In production, this would be hashed
      role: "superadmin",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Initialize emergency settings
    const emergencySettings = [
      { settingName: "content_kill_switch", isEnabled: false },
      { settingName: "maintenance_mode", isEnabled: false },
      { settingName: "sound_alerts", isEnabled: true },
    ];

    emergencySettings.forEach(setting => {
      const emergencySetting: EmergencySetting = {
        id: randomUUID(),
        settingName: setting.settingName,
        isEnabled: setting.isEnabled,
        lastModifiedBy: adminUser.id,
        lastModifiedAt: new Date(),
      };
      this.emergencySettings.set(setting.settingName, emergencySetting);
    });

    // Initialize system health
    const healthServices = [
      { service: "api", status: "operational", responseTime: "1.2s", uptime: "99.8%" },
      { service: "database", status: "operational", responseTime: "45ms", uptime: "99.9%" },
      { service: "realtime", status: "operational", responseTime: "23ms", uptime: "99.7%" },
      { service: "external_services", status: "degraded", responseTime: "2.1s", uptime: "98.5%" },
    ];

    healthServices.forEach(health => {
      const systemHealth: SystemHealth = {
        id: randomUUID(),
        service: health.service,
        status: health.status,
        responseTime: health.responseTime,
        uptime: health.uptime,
        details: {},
        timestamp: new Date(),
      };
      this.systemHealth.set(health.service, systemHealth);
    });

    // Initialize system metrics
    const metrics = [
      { metricType: "device_discovery_rate", value: "87.3", previousValue: "90.0" },
      { metricType: "mrr", value: "47892", previousValue: "42650" },
      { metricType: "active_homes", value: "1247", previousValue: "1224" },
      { metricType: "churn_rate", value: "2.1", previousValue: "2.4" },
    ];

    metrics.forEach(metric => {
      const systemMetric: SystemMetric = {
        id: randomUUID(),
        metricType: metric.metricType,
        value: metric.value,
        previousValue: metric.previousValue,
        timestamp: new Date(),
        metadata: {},
      };
      this.systemMetrics.set(metric.metricType, systemMetric);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // System Metrics methods
  async getSystemMetrics(): Promise<SystemMetric[]> {
    return Array.from(this.systemMetrics.values());
  }

  async getSystemMetricByType(type: string): Promise<SystemMetric | undefined> {
    return this.systemMetrics.get(type);
  }

  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    const id = randomUUID();
    const metric: SystemMetric = {
      ...insertMetric,
      id,
      timestamp: new Date(),
    };
    this.systemMetrics.set(insertMetric.metricType, metric);
    return metric;
  }

  async updateSystemMetric(id: string, updates: Partial<SystemMetric>): Promise<SystemMetric | undefined> {
    const metric = Array.from(this.systemMetrics.values()).find(m => m.id === id);
    if (metric) {
      const updated = { ...metric, ...updates };
      this.systemMetrics.set(metric.metricType, updated);
      return updated;
    }
    return undefined;
  }

  // System Health methods
  async getSystemHealth(): Promise<SystemHealth[]> {
    return Array.from(this.systemHealth.values());
  }

  async getSystemHealthByService(service: string): Promise<SystemHealth | undefined> {
    return this.systemHealth.get(service);
  }

  async createSystemHealth(insertHealth: InsertSystemHealth): Promise<SystemHealth> {
    const id = randomUUID();
    const health: SystemHealth = {
      ...insertHealth,
      id,
      timestamp: new Date(),
    };
    this.systemHealth.set(insertHealth.service, health);
    return health;
  }

  async updateSystemHealth(id: string, updates: Partial<SystemHealth>): Promise<SystemHealth | undefined> {
    const health = Array.from(this.systemHealth.values()).find(h => h.id === id);
    if (health) {
      const updated = { ...health, ...updates };
      this.systemHealth.set(health.service, updated);
      return updated;
    }
    return undefined;
  }

  // Critical Alerts methods
  async getCriticalAlerts(): Promise<CriticalAlert[]> {
    return Array.from(this.criticalAlerts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getActiveCriticalAlerts(): Promise<CriticalAlert[]> {
    return Array.from(this.criticalAlerts.values())
      .filter(alert => alert.isActive && !alert.isDismissed)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createCriticalAlert(insertAlert: InsertCriticalAlert): Promise<CriticalAlert> {
    const id = randomUUID();
    const alert: CriticalAlert = {
      ...insertAlert,
      id,
      createdAt: new Date(),
      dismissedAt: null,
    };
    this.criticalAlerts.set(id, alert);
    return alert;
  }

  async dismissCriticalAlert(id: string): Promise<CriticalAlert | undefined> {
    const alert = this.criticalAlerts.get(id);
    if (alert) {
      const updated = { 
        ...alert, 
        isDismissed: true, 
        dismissedAt: new Date() 
      };
      this.criticalAlerts.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Activity Log methods
  async getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
    return this.activityLog
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.activityLog.push(log);
    return log;
  }

  // Emergency Settings methods
  async getEmergencySettings(): Promise<EmergencySetting[]> {
    return Array.from(this.emergencySettings.values());
  }

  async getEmergencySettingByName(name: string): Promise<EmergencySetting | undefined> {
    return this.emergencySettings.get(name);
  }

  async updateEmergencySetting(name: string, updates: Partial<EmergencySetting>): Promise<EmergencySetting | undefined> {
    const setting = this.emergencySettings.get(name);
    if (setting) {
      const updated = { 
        ...setting, 
        ...updates, 
        lastModifiedAt: new Date() 
      };
      this.emergencySettings.set(name, updated);
      return updated;
    }
    return undefined;
  }

  // Homes methods
  async getHomes(): Promise<Home[]> {
    return Array.from(this.homes.values());
  }

  async getActiveHomesCount(): Promise<number> {
    return Array.from(this.homes.values()).filter(home => home.status === "active").length;
  }

  async createHome(insertHome: InsertHome): Promise<Home> {
    const id = randomUUID();
    const home: Home = {
      ...insertHome,
      id,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    this.homes.set(id, home);
    return home;
  }
}

export const storage = new MemStorage();

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
  type CustomerHome,
  type InsertCustomerHome,
  type Device,
  type InsertDevice,
  type DeviceDocumentation,
  type InsertDeviceDocumentation,
  users,
  systemMetrics,
  systemHealth,
  criticalAlerts,
  activityLog,
  emergencySettings,
  homes,
  customerHomes,
  devices,
  deviceDocumentation
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

  // Homes (legacy admin data)
  getHomes(): Promise<Home[]>;
  getActiveHomesCount(): Promise<number>;
  createHome(home: InsertHome): Promise<Home>;

  // Customer Homes
  getCustomerHomes(userId?: string): Promise<CustomerHome[]>;
  getCustomerHome(id: string): Promise<CustomerHome | undefined>;
  createCustomerHome(home: InsertCustomerHome): Promise<CustomerHome>;
  updateCustomerHome(id: string, home: Partial<CustomerHome>): Promise<CustomerHome | undefined>;

  // Devices
  getDevices(homeId: string): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, device: Partial<Device>): Promise<Device | undefined>;

  // Device Documentation
  getDeviceDocumentation(deviceId: string): Promise<DeviceDocumentation[]>;
  createDeviceDocumentation(doc: InsertDeviceDocumentation): Promise<DeviceDocumentation>;
}

export class DatabaseStorage implements IStorage {
  private memStorage: Map<string, any> = new Map();
  private useDatabase: boolean = false;

  constructor() {
    this.useDatabase = false; // Force memory storage for now
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize in-memory storage collections
    this.memStorage.set('users', []);
    this.memStorage.set('systemMetrics', []);
    this.memStorage.set('systemHealth', []);
    this.memStorage.set('criticalAlerts', []);
    this.memStorage.set('activityLog', []);
    this.memStorage.set('emergencySettings', []);
    this.memStorage.set('homes', []);
    this.memStorage.set('customerHomes', []);
    this.memStorage.set('devices', []);
    this.memStorage.set('deviceDocumentation', []);

    // Create sample emergency settings with proper structure
    const emergencySettingsData = [
      { settingName: "content_kill_switch", isEnabled: false },
      { settingName: "maintenance_mode", isEnabled: false },
      { settingName: "sound_alerts", isEnabled: true },
    ];

    emergencySettingsData.forEach(data => {
      const setting: EmergencySetting = {
        id: randomUUID(),
        settingName: data.settingName,
        isEnabled: data.isEnabled,
        lastModifiedBy: null,
        lastModifiedAt: new Date(),
      };
      this.memStorage.get('emergencySettings').push(setting);
    });

    // Create sample system health data
    const healthData = [
      { service: "api", status: "operational", responseTime: "1.2s", uptime: "99.8%" },
      { service: "database", status: "operational", responseTime: "45ms", uptime: "99.9%" },
      { service: "realtime", status: "operational", responseTime: "23ms", uptime: "99.7%" },
      { service: "external_services", status: "degraded", responseTime: "2.1s", uptime: "98.5%" },
    ];

    healthData.forEach(data => {
      const health: SystemHealth = {
        id: randomUUID(),
        service: data.service,
        status: data.status,
        responseTime: data.responseTime,
        uptime: data.uptime,
        details: {},
        timestamp: new Date(),
      };
      this.memStorage.get('systemHealth').push(health);
    });

    // Create sample system metrics
    const metricsData = [
      { metricType: "device_discovery_rate", value: "87.3", previousValue: "90.0" },
      { metricType: "mrr", value: "47892", previousValue: "42650" },
      { metricType: "active_homes", value: "1247", previousValue: "1224" },
      { metricType: "churn_rate", value: "2.1", previousValue: "2.4" },
    ];

    metricsData.forEach(data => {
      const metric: SystemMetric = {
        id: randomUUID(),
        metricType: data.metricType,
        value: data.value,
        previousValue: data.previousValue,
        metadata: {},
        timestamp: new Date(),
      };
      this.memStorage.get('systemMetrics').push(metric);
    });

    // Add sample activity logs
    const activityLogs = [
      {
        id: randomUUID(),
        eventType: "system_alert",
        title: "Device Discovery Rate Dropped",
        description: "Device discovery rate fell below 90% threshold",
        severity: "warning",
        userId: null,
        metadata: {},
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: randomUUID(),
        eventType: "user_action", 
        title: "Emergency Setting Updated",
        description: "Content kill switch was enabled by admin",
        severity: "critical",
        userId: null,
        metadata: {},
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      }
    ];

    this.memStorage.set('activityLog', activityLogs);

    // Add sample customer homes and devices for testing
    const sampleHomes = [
      {
        id: "home-1",
        name: "Johnson Family Home",
        address: "123 Maple Street, Springfield, IL",
        primaryAdminId: "admin-1",
        status: "active",
        timezone: "America/Chicago",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        id: "home-2", 
        name: "The Smith Residence",
        address: "456 Oak Avenue, Denver, CO",
        primaryAdminId: "admin-2",
        status: "active",
        timezone: "America/Denver",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
    ];

    this.memStorage.set('customerHomes', sampleHomes);

    // Add sample devices for the homes
    const sampleDevices = [
      {
        id: "device-1",
        homeId: "home-1",
        name: "Living Room TV",
        manufacturer: "Samsung",
        model: "QN65Q70T",
        category: "entertainment",
        roomLocation: "Living Room",
        status: "active",
        discoveryMethod: "wifi_scan",
        metadata: { ipAddress: "192.168.1.100" },
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        id: "device-2",
        homeId: "home-1",
        name: "Nest Thermostat",
        manufacturer: "Google",
        model: "Learning Thermostat",
        category: "climate",
        roomLocation: "Hallway",
        status: "active",
        discoveryMethod: "manual",
        metadata: { temperature: 72 },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        id: "device-3",
        homeId: "home-2",
        name: "Kitchen Echo",
        manufacturer: "Amazon",
        model: "Echo Dot 4th Gen",
        category: "voice_assistant",
        roomLocation: "Kitchen",
        status: "active",
        discoveryMethod: "manual",
        metadata: {},
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ];

    this.memStorage.set('devices', sampleDevices);
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
      const users = Array.from(this.memStorage.get('users').values()) as User[];
      return users.find((user: User) => user.username === username);
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
      return Array.from(this.memStorage.get('systemMetrics').values()) as SystemMetric[];
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
      const metrics = Array.from(this.memStorage.get('systemMetrics').values()) as SystemMetric[];
      const metric = metrics.find((m: SystemMetric) => m.id === id);
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
      return Array.from(this.memStorage.get('systemHealth').values()) as SystemHealth[];
    }
    return await db.select().from(systemHealth);
  }

  async getSystemHealthByService(service: string): Promise<SystemHealth | undefined> {
    if (!this.useDatabase) {
      const healthMap = this.memStorage.get('systemHealth');
      if (healthMap && healthMap instanceof Map) {
        return healthMap.get(service);
      }
      // Fallback: search through values if map is corrupted
      const healthArray = Array.from(this.memStorage.get('systemHealth').values()) as SystemHealth[];
      return healthArray.find((h: SystemHealth) => h.service === service);
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
      const healthArray = Array.from(this.memStorage.get('systemHealth').values()) as SystemHealth[];
      const health = healthArray.find((h: SystemHealth) => h.id === id);
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
      this.memStorage.get('homes').push(home);
      return home;
    }
    const [dbHome] = await db.insert(homes).values(insertHome).returning();
    return dbHome;
  }

  // Customer Homes methods
  async getCustomerHomes(userId?: string): Promise<CustomerHome[]> {
    if (!this.useDatabase) {
      return this.memStorage.get('customerHomes');
    }
    return await db.select().from(customerHomes);
  }

  async getCustomerHome(id: string): Promise<CustomerHome | undefined> {
    if (!this.useDatabase) {
      return this.memStorage.get('customerHomes').find((home: CustomerHome) => home.id === id);
    }
    const result = await db.select().from(customerHomes).where(eq(customerHomes.id, id)).limit(1);
    return result[0];
  }

  async createCustomerHome(insertHome: InsertCustomerHome): Promise<CustomerHome> {
    const id = randomUUID();
    const home: CustomerHome = {
      ...insertHome,
      id,
      status: insertHome.status || "active",
      createdAt: new Date(),
    };

    if (!this.useDatabase) {
      this.memStorage.get('customerHomes').push(home);
      return home;
    }
    const [dbHome] = await db.insert(customerHomes).values(insertHome).returning();
    return dbHome;
  }

  async updateCustomerHome(id: string, updates: Partial<CustomerHome>): Promise<CustomerHome | undefined> {
    if (!this.useDatabase) {
      const homes = this.memStorage.get('customerHomes');
      const index = homes.findIndex((home: CustomerHome) => home.id === id);
      if (index !== -1) {
        homes[index] = { ...homes[index], ...updates };
        return homes[index];
      }
      return undefined;
    }
    const result = await db.update(customerHomes)
      .set(updates)
      .where(eq(customerHomes.id, id))
      .returning();
    return result[0];
  }

  // Devices methods
  async getDevices(homeId: string): Promise<Device[]> {
    if (!this.useDatabase) {
      return this.memStorage.get('devices').filter((device: Device) => device.homeId === homeId);
    }
    return await db.select().from(devices).where(eq(devices.homeId, homeId));
  }

  async getDevice(id: string): Promise<Device | undefined> {
    if (!this.useDatabase) {
      return this.memStorage.get('devices').find((device: Device) => device.id === id);
    }
    const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
    return result[0];
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = randomUUID();
    const device: Device = {
      ...insertDevice,
      id,
      status: insertDevice.status || "active",
      metadata: insertDevice.metadata || {},
      createdAt: new Date(),
    };

    if (!this.useDatabase) {
      this.memStorage.get('devices').push(device);
      return device;
    }
    const [dbDevice] = await db.insert(devices).values(insertDevice).returning();
    return dbDevice;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    if (!this.useDatabase) {
      const deviceList = this.memStorage.get('devices');
      const index = deviceList.findIndex((device: Device) => device.id === id);
      if (index !== -1) {
        deviceList[index] = { ...deviceList[index], ...updates };
        return deviceList[index];
      }
      return undefined;
    }
    const result = await db.update(devices)
      .set(updates)
      .where(eq(devices.id, id))
      .returning();
    return result[0];
  }

  // Device Documentation methods
  async getDeviceDocumentation(deviceId: string): Promise<DeviceDocumentation[]> {
    if (!this.useDatabase) {
      return this.memStorage.get('deviceDocumentation').filter((doc: DeviceDocumentation) => doc.deviceId === deviceId);
    }
    return await db.select().from(deviceDocumentation).where(eq(deviceDocumentation.deviceId, deviceId));
  }

  async createDeviceDocumentation(insertDoc: InsertDeviceDocumentation): Promise<DeviceDocumentation> {
    const id = randomUUID();
    const doc: DeviceDocumentation = {
      ...insertDoc,
      id,
      createdAt: new Date(),
    };

    if (!this.useDatabase) {
      this.memStorage.get('deviceDocumentation').push(doc);
      return doc;
    }
    const [dbDoc] = await db.insert(deviceDocumentation).values(insertDoc).returning();
    return dbDoc;
  }
}

export const storage = new DatabaseStorage();

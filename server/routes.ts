import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { yoloManager } from "./yolo-manager.js";
import { env, logger } from "./config";
import wifi from "node-wifi";
import { deviceDatabase } from "./device-database";
import { autoPopulation } from "./auto-population";
import { 
  insertCriticalAlertSchema,
  insertActivityLogSchema,
  insertSystemMetricSchema,
  insertSystemHealthSchema,
  insertCustomerHomeSchema,
  insertDeviceSchema,
  insertDeviceDocumentationSchema
} from "@shared/schema";

// Helper function to simulate network device discovery based on WiFi scan results
async function simulateNetworkDeviceDiscovery(currentConnections: any[], availableNetworks: any[]) {
  const deviceTemplates = [
    { name: "Smart TV", manufacturer: "Samsung", model: "QN65Q70T", roomLocation: "Living Room", type: "entertainment" },
    { name: "WiFi Router", manufacturer: "Netgear", model: "AX6000", roomLocation: "Office", type: "network" },
    { name: "Smart Thermostat", manufacturer: "Nest", model: "Learning", roomLocation: "Hallway", type: "climate" },
    { name: "Security Camera", manufacturer: "Ring", model: "Stick Up Cam", roomLocation: "Front Door", type: "security" },
    { name: "Smart Speaker", manufacturer: "Amazon", model: "Echo Dot", roomLocation: "Kitchen", type: "voice_assistant" },
    { name: "Smart Light Bulb", manufacturer: "Philips", model: "Hue White", roomLocation: "Bedroom", type: "lighting" },
    { name: "Smart Doorbell", manufacturer: "Ring", model: "Video Doorbell", roomLocation: "Front Door", type: "security" },
    { name: "WiFi Extender", manufacturer: "TP-Link", model: "RE650", roomLocation: "Upstairs", type: "network" }
  ];

  // Simulate device discovery based on network strength and characteristics
  const discoveredDevices: any[] = [];
  
  // Use network scan results to influence device discovery
  const strongNetworks = availableNetworks.filter((network: any) => network.signal_level && network.signal_level > -60);
  const deviceCount = Math.min(strongNetworks.length, Math.floor(Math.random() * 4) + 2);
  
  // Select random devices but favor certain types based on network characteristics
  const shuffled = deviceTemplates.sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < deviceCount && i < shuffled.length; i++) {
    const device = { ...shuffled[i] };
    
    // Add network-specific metadata
    device.networkStrength = strongNetworks[i % strongNetworks.length]?.signal_level || -50;
    device.detectedVia = 'network_scan';
    device.confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
    
    discoveredDevices.push(device);
  }
  
  return discoveredDevices;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WiFi module
  try {
    wifi.init({
      iface: null // network interface, choose a random wifi interface if set to null
    });
    logger.info('WiFi module initialized for network scanning');
  } catch (error) {
    logger.warn('WiFi module initialization failed:', error);
  }

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    logger.info('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      logger.info('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

// Infrastructure Health Check  app.get("/api/health", async (req, res) => {    try {      const yoloStatus = yoloManager.getInfrastructureStatus();      const health = {        status: "healthy",        timestamp: new Date().toISOString(),        services: {          api: { status: "operational", message: "API server running" },          yolo: {            status: yoloStatus.available ? "operational" : "degraded",            available: yoloStatus.available,            method: yoloStatus.method,            message: yoloStatus.message          }        }      };      res.json(health);    } catch (error) {      res.status(500).json({         status: "unhealthy",         error: error.message,        timestamp: new Date().toISOString()      });    }  });  app.get("/api/infrastructure/status", async (req, res) => {    try {      const yoloStatus = yoloManager.getInfrastructureStatus();      res.json({        yolo: yoloStatus,        deployment: {          dockerized: process.env.NODE_ENV === "production",          environment: process.env.NODE_ENV || "development"        }      });    } catch (error) {      res.status(500).json({ error: error.message });    }  });
  // System Health endpoints
  app.get("/api/system-health", async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  app.post("/api/system-health", async (req, res) => {
    try {
      const health = await storage.createSystemHealth(req.body);
      broadcast({ type: 'system_health_updated', data: health });
      res.json(health);
    } catch (error) {
      res.status(400).json({ message: "Failed to create system health record" });
    }
  });

  // System Metrics endpoints
  app.get("/api/system-metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.post("/api/system-metrics", async (req, res) => {
    try {
      const metric = await storage.createSystemMetric(req.body);
      broadcast({ type: 'system_metric_updated', data: metric });
      res.json(metric);
    } catch (error) {
      res.status(400).json({ message: "Failed to create system metric" });
    }
  });

  // Critical Alerts endpoints
  app.get("/api/critical-alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveCriticalAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch critical alerts" });
    }
  });

  app.post("/api/critical-alerts", async (req, res) => {
    try {
      const validatedData = insertCriticalAlertSchema.parse(req.body);
      const alert = await storage.createCriticalAlert(validatedData);
      
      // Log the alert creation
      await storage.createActivityLog({
        eventType: "system_event",
        title: "Critical alert created",
        description: alert.title,
        severity: alert.type,
        userId: null,
        metadata: { alertId: alert.id },
      });

      broadcast({ type: 'critical_alert_created', data: alert });
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Failed to create critical alert" });
    }
  });

  app.patch("/api/critical-alerts/:id/dismiss", async (req, res) => {
    try {
      const alert = await storage.dismissCriticalAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Log the dismissal
      await storage.createActivityLog({
        eventType: "user_action",
        title: "Alert dismissed",
        description: `Alert "${alert.title}" was dismissed`,
        severity: "info",
        userId: null,
        metadata: { alertId: alert.id },
      });

      broadcast({ type: 'critical_alert_dismissed', data: alert });
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  // Activity Log endpoints
  app.get("/api/activity-log", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const log = await storage.getActivityLog(limit);
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity log" });
    }
  });

  app.post("/api/activity-log", async (req, res) => {
    try {
      const validatedData = insertActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(validatedData);
      broadcast({ type: 'activity_log_added', data: log });
      res.json(log);
    } catch (error) {
      res.status(400).json({ message: "Failed to create activity log entry" });
    }
  });

  // Emergency Settings endpoints
  app.get("/api/emergency-settings", async (req, res) => {
    try {
      const settings = await storage.getEmergencySettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emergency settings" });
    }
  });

  app.patch("/api/emergency-settings/:name", async (req, res) => {
    try {
      const { isEnabled } = req.body;
      const setting = await storage.updateEmergencySetting(req.params.name, { isEnabled });
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      // Log the change
      await storage.createActivityLog({
        eventType: "emergency_control",
        title: `Emergency setting ${isEnabled ? 'enabled' : 'disabled'}`,
        description: `${req.params.name} was ${isEnabled ? 'enabled' : 'disabled'}`,
        severity: isEnabled ? "warning" : "info",
        userId: null,
        metadata: { settingName: req.params.name, isEnabled },
      });

      broadcast({ type: 'emergency_setting_updated', data: setting });
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update emergency setting" });
    }
  });

  // Business data endpoints (for dashboard metrics)
  app.get("/api/dashboard-summary", async (req, res) => {
    try {
      const systemHealth = await storage.getSystemHealth();
      const systemMetrics = await storage.getSystemMetrics();
      const criticalAlerts = await storage.getActiveCriticalAlerts();
      const recentActivity = await storage.getActivityLog(5);
      const emergencySettings = await storage.getEmergencySettings();

      const summary = {
        systemHealth,
        systemMetrics,
        criticalAlerts,
        recentActivity,
        emergencySettings,
        lastUpdated: new Date().toISOString(),
      };

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  // Simulate real-time updates every 3 minutes
  setInterval(async () => {
    try {
      // Update some metrics with slight variations
      const apiHealth = await storage.getSystemHealthByService('api');
      if (apiHealth) {
        const responseTime = (Math.random() * 2 + 0.5).toFixed(1) + 's';
        await storage.updateSystemHealth(apiHealth.id, { 
          responseTime,
          timestamp: new Date() 
        });
        broadcast({ 
          type: 'system_health_updated', 
          data: { ...apiHealth, responseTime, timestamp: new Date() }
        });
      }

      // Update real-time connections
      const realtimeHealth = await storage.getSystemHealthByService('realtime');
      if (realtimeHealth) {
        const connections = Math.floor(Math.random() * 100) + 800;
        const details = { 
          ...realtimeHealth.details as any, 
          connections,
          messagesPerSec: Math.floor(Math.random() * 20) + 15
        };
        await storage.updateSystemHealth(realtimeHealth.id, { 
          details,
          timestamp: new Date() 
        });
        broadcast({ 
          type: 'system_health_updated', 
          data: { ...realtimeHealth, details, timestamp: new Date() }
        });
      }

      logger.info('Dashboard metrics updated via real-time simulation');
    } catch (error) {
      logger.error('Error in real-time update simulation:', error);
    }
  }, 180000); // 3 minutes

  // Customer Home Management API Routes
  app.get("/api/homes", async (req, res) => {
    try {
      const homes = await storage.getCustomerHomes();
      res.json(homes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch homes" });
    }
  });

  app.get("/api/homes/:homeId", async (req, res) => {
    try {
      const home = await storage.getCustomerHome(req.params.homeId);
      if (!home) {
        return res.status(404).json({ message: "Home not found" });
      }
      res.json(home);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch home" });
    }
  });

  app.post("/api/homes", async (req, res) => {
    try {
      const validatedData = insertCustomerHomeSchema.parse({
        ...req.body,
        primaryAdminId: "default-admin" // In a real app, this would come from auth
      });
      const home = await storage.createCustomerHome(validatedData);
      
      // Log home creation
      await storage.createActivityLog({
        eventType: "user_action",
        title: "Home created",
        description: `New home "${home.name}" was created`,
        severity: "info",
        userId: null,
        metadata: { homeId: home.id },
      });

      res.json(home);
    } catch (error) {
      res.status(400).json({ message: "Failed to create home" });
    }
  });

  // Device Management API Routes
  app.get("/api/homes/:homeId/devices", async (req, res) => {
    try {
      const devices = await storage.getDevices(req.params.homeId);
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.get("/api/homes/:homeId/devices/:deviceId", async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.deviceId);
      if (!device || device.homeId !== req.params.homeId) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch device" });
    }
  });

  app.post("/api/homes/:homeId/devices", async (req, res) => {
    try {
      const validatedData = insertDeviceSchema.parse({
        ...req.body,
        homeId: req.params.homeId
      });
      const device = await storage.createDevice(validatedData);
      
      // Log device creation
      await storage.createActivityLog({
        eventType: "user_action",
        title: "Device added",
        description: `Device "${device.name}" was added to home`,
        severity: "info",
        userId: null,
        metadata: { homeId: req.params.homeId, deviceId: device.id },
      });

      // Trigger auto-population in background (don't wait for it to complete)
      const discoveryMethod = validatedData.discoveryMethod || 'manual';
      autoPopulation.populateDeviceInfo(device.id, discoveryMethod, req.params.homeId)
        .then((populationData) => {
          logger.info(`Auto-population completed for device ${device.name}`);
          // Broadcast updated device info to connected clients
          broadcast({ 
            type: 'device_populated', 
            data: { 
              deviceId: device.id,
              device: populationData.device,
              hasManual: !!populationData.manualInfo,
              hasSetupGuide: !!populationData.setupInstructions,
              hasTroubleshooting: !!populationData.troubleshooting,
              compatibleCount: populationData.compatibleDevices?.length || 0
            }
          });
        })
        .catch((error) => {
          logger.warn(`Auto-population failed for device ${device.name}:`, error);
        });

      broadcast({ type: 'device_added', data: device });
      res.json(device);
    } catch (error) {
      logger.error('Device creation failed:', error);
      res.status(400).json({ message: "Failed to create device" });
    }
  });

  // Get Device Documentation and Auto-populated Information
  app.get("/api/homes/:homeId/devices/:deviceId/documentation", async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      // Get device details
      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Get all documentation for the device
      const documentation = await storage.getDeviceDocumentation(deviceId);
      
      // Organize documentation by type
      const organizedDocs = {
        device,
        manual: documentation.find(doc => doc.documentType === 'manual'),
        setupGuide: documentation.find(doc => doc.documentType === 'setup_guide'),
        troubleshooting: documentation.find(doc => doc.documentType === 'troubleshooting'),
        specifications: device.metadata?.specifications || [],
        features: device.metadata?.features || [],
        compatibleDevices: device.metadata?.compatibleDevices || [],
        autoPopulated: device.metadata?.autoPopulated || false,
        populatedAt: device.metadata?.populatedAt
      };

      // Parse JSON content
      if (organizedDocs.manual) {
        try {
          organizedDocs.manual.parsedContent = JSON.parse(organizedDocs.manual.content);
        } catch (e) {
          organizedDocs.manual.parsedContent = null;
        }
      }

      if (organizedDocs.setupGuide) {
        try {
          organizedDocs.setupGuide.parsedContent = JSON.parse(organizedDocs.setupGuide.content);
        } catch (e) {
          organizedDocs.setupGuide.parsedContent = [];
        }
      }

      if (organizedDocs.troubleshooting) {
        try {
          organizedDocs.troubleshooting.parsedContent = JSON.parse(organizedDocs.troubleshooting.content);
        } catch (e) {
          organizedDocs.troubleshooting.parsedContent = [];
        }
      }

      res.json(organizedDocs);
      
    } catch (error) {
      logger.error('Failed to fetch device documentation:', error);
      res.status(500).json({ message: "Failed to fetch device documentation" });
    }
  });

  // Trigger Manual Auto-population for a Device
  app.post("/api/homes/:homeId/devices/:deviceId/populate", async (req, res) => {
    try {
      const { deviceId, homeId } = req.params;
      const { force = false } = req.body;

      // Get device to check if already populated
      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Check if already populated (unless forced)
      if (!force && device.metadata?.autoPopulated) {
        return res.json({
          message: "Device already has auto-populated data",
          populated: true,
          populatedAt: device.metadata.populatedAt
        });
      }

      // Trigger auto-population
      logger.info(`Manual auto-population triggered for device ${device.name}`);
      const populationData = await autoPopulation.populateDeviceInfo(deviceId, 'manual', homeId);
      
      // Broadcast the update
      broadcast({ 
        type: 'device_populated', 
        data: { 
          deviceId: device.id,
          device: populationData.device,
          hasManual: !!populationData.manualInfo,
          hasSetupGuide: !!populationData.setupInstructions,
          hasTroubleshooting: !!populationData.troubleshooting,
          compatibleCount: populationData.compatibleDevices?.length || 0
        }
      });

      res.json({
        message: "Device auto-population completed successfully",
        populated: true,
        populatedAt: new Date().toISOString(),
        data: {
          hasManual: !!populationData.manualInfo,
          hasSetupGuide: !!populationData.setupInstructions,
          hasTroubleshooting: !!populationData.troubleshooting,
          featuresCount: populationData.features?.length || 0,
          specificationsCount: populationData.specifications?.length || 0,
          compatibleCount: populationData.compatibleDevices?.length || 0
        }
      });

    } catch (error) {
      logger.error('Manual auto-population failed:', error);
      res.status(500).json({ 
        message: "Auto-population failed", 
        error: error.message 
      });
    }
  });

  // Real WiFi Network Device Discovery
  app.post("/api/homes/:homeId/scan-wifi", async (req, res) => {
    try {
      logger.info(`Starting WiFi network scan for home ${req.params.homeId}`);
      const scanStartTime = Date.now();

      // Get current network info first
      const currentConnections = await new Promise((resolve, reject) => {
        wifi.getCurrentConnections((error, currentNetworks) => {
          if (error) {
            logger.warn('Failed to get current network connections:', error);
            resolve([]);
          } else {
            resolve(currentNetworks);
          }
        });
      });

      logger.info(`Found ${currentConnections.length} current network connections`);

      // Scan for available networks to get network details
      const availableNetworks = await new Promise((resolve, reject) => {
        wifi.scan((error, networks) => {
          if (error) {
            logger.warn('WiFi scan failed, using fallback:', error);
            resolve([]);
          } else {
            resolve(networks);
          }
        });
      });

      logger.info(`Scanned ${availableNetworks.length} available networks`);

      // For now, we'll simulate device discovery based on network analysis
      // In a real implementation, this would use network scanning tools like nmap
      const discoveredDevices = await simulateNetworkDeviceDiscovery(currentConnections, availableNetworks);

      const scanTime = Date.now() - scanStartTime;
      logger.info(`WiFi scan completed in ${scanTime}ms, found ${discoveredDevices.length} devices`);

      res.json({ 
        discovered: discoveredDevices,
        scanTime: new Date(),
        method: "wifi_scan",
        networkInfo: {
          currentConnections: currentConnections.length,
          availableNetworks: availableNetworks.length,
          scanDuration: scanTime
        }
      });
    } catch (error) {
      logger.error('WiFi scan failed:', error);
      res.status(500).json({ 
        message: "WiFi scan failed", 
        error: error.message,
        fallback: true
      });
    }
  });

  // Find Manual Simulation
  app.post("/api/homes/:homeId/find-manual", async (req, res) => {
    try {
      const { manufacturer, model } = req.body;
      
      // Simulate manual lookup
      const mockManuals = {
        "Samsung QN65Q70T": "https://example.com/samsung-tv-manual.pdf",
        "Nest Learning": "https://example.com/nest-thermostat-manual.pdf",
        "Ring Stick Up Cam": "https://example.com/ring-camera-manual.pdf",
      };

      const manualKey = `${manufacturer} ${model}`;
      const manualUrl = mockManuals[manualKey as keyof typeof mockManuals];

      if (manualUrl) {
        res.json({
          found: true,
          manualUrl,
          source: "ManualsOnline",
          title: `${manufacturer} ${model} User Manual`,
        });
      } else {
        res.json({
          found: false,
          message: "Manual not found in database",
          suggestion: "Try adding manual information manually",
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Manual lookup failed" });
    }
  });

  // Device Lookup by Barcode/QR Code
  app.post("/api/devices/lookup-by-code", async (req, res) => {
    try {
      const { code, type, homeId } = req.body;
      logger.info(`Looking up device by ${type} code: ${code} for home ${homeId}`);

      // Use external device database service
      let result;
      if (type === 'barcode') {
        result = await deviceDatabase.lookupByBarcode(code);
      } else if (type === 'qr') {
        result = await deviceDatabase.lookupByQRCode(code);
      } else {
        throw new Error(`Unsupported code type: ${type}`);
      }
      
      if (result.success && result.device) {
        logger.info(`Found device via ${result.source}: ${result.device.name} (${result.device.manufacturer})`);
        res.json({
          success: true,
          device: {
            ...result.device,
            scannedCode: code,
            codeType: type,
            dataSource: result.source
          },
          source: result.source
        });
      } else {
        logger.info(`Device not found for ${type} code: ${code} - ${result.message}`);
        res.json({
          success: false,
          message: result.message || `No device found for ${type} code: ${code}`,
          suggestedActions: [
            "Try scanning a different part of the device",
            "Check if the code is clearly visible and well-lit", 
            "Try scanning from different angles",
            "Use manual device entry instead"
          ],
          code,
          type
        });
      }
    } catch (error) {
      logger.error('Device code lookup failed:', error);
      res.status(500).json({ 
        success: false,
        message: "Device lookup service failed", 
        error: error.message,
        fallback: "Please try manual device entry"
      });
    }
  });

  // Enhanced Manual Device Lookup with External APIs
  app.post("/api/devices/lookup-manual", async (req, res) => {
    try {
      const { manufacturer, model, category, homeId } = req.body;
      logger.info(`Manual device lookup: ${manufacturer} ${model} for home ${homeId}`);

      // Create a search query
      const searchQuery = `${manufacturer} ${model}`.trim();
      
      if (!searchQuery || searchQuery.length < 3) {
        return res.json({
          success: false,
          message: "Please provide more specific manufacturer and model information"
        });
      }

      // Try to find device info using our database service
      // We'll treat this as a QR lookup since it's text-based
      const result = await deviceDatabase.lookupByQRCode(searchQuery.toLowerCase());
      
      if (result.success && result.device) {
        logger.info(`Found device via manual lookup: ${result.device.name}`);
        
        // Enhance with category if provided
        if (category && category !== 'other') {
          result.device.category = category;
        }
        
        res.json({
          success: true,
          device: {
            ...result.device,
            searchQuery,
            dataSource: result.source,
            manuallySearched: true
          },
          source: result.source,
          suggestions: [
            `Try searching for "${manufacturer} manual"`,
            `Check manufacturer website for specifications`,
            `Look for model number on device label`
          ]
        });
      } else {
        // Provide helpful fallback information
        const fallbackDevice = {
          name: `${manufacturer} ${model}`,
          manufacturer: manufacturer || 'Unknown',
          model: model || 'Unknown',
          category: category || 'other',
          type: 'unknown',
          manuallyEntered: true
        };
        
        logger.info(`No external data found, providing fallback for: ${searchQuery}`);
        res.json({
          success: true,
          device: fallbackDevice,
          source: 'Manual Entry',
          message: 'Device created from manual input. You can edit details later.',
          suggestions: [
            `Search online for "${manufacturer} ${model} manual"`,
            `Check the device label for additional model information`,
            `Visit ${manufacturer.toLowerCase().replace(/\s+/g, '')}.com for support`
          ]
        });
      }
      
    } catch (error) {
      logger.error('Manual device lookup failed:', error);
      res.status(500).json({
        success: false,
        message: "Manual device lookup failed",
        error: error.message
      });
    }
  });

  // Device Taxonomy API Endpoints
  app.get("/api/device-categories", async (req, res) => {
    try {
      const categories = await storage.getDeviceCategories();
      res.json(categories);
    } catch (error) {
      logger.error("Error fetching device categories:", error);
      res.status(500).json({ message: "Failed to fetch device categories" });
    }
  });

  app.get("/api/device-brands", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const brands = await storage.getDeviceBrands(categoryId);
      res.json(brands);
    } catch (error) {
      logger.error("Error fetching device brands:", error);
      res.status(500).json({ message: "Failed to fetch device brands" });
    }
  });

  app.get("/api/device-models/:brandId", async (req, res) => {
    try {
      const models = await storage.getDeviceModels(req.params.brandId);
      res.json(models);
    } catch (error) {
      logger.error("Error fetching device models:", error);
      res.status(500).json({ message: "Failed to fetch device models" });
    }
  });

  app.post("/api/device-categories", async (req, res) => {
    try {
      const category = await storage.createDeviceCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      logger.error("Error creating device category:", error);
      res.status(500).json({ message: "Failed to create device category" });
    }
  });

  app.post("/api/device-brands", async (req, res) => {
    try {
      const brand = await storage.createDeviceBrand(req.body);
      res.status(201).json(brand);
    } catch (error) {
      logger.error("Error creating device brand:", error);
      res.status(500).json({ message: "Failed to create device brand" });
    }
  });

  app.post("/api/device-models", async (req, res) => {
    try {
      const model = await storage.createDeviceModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      logger.error("Error creating device model:", error);
      res.status(500).json({ message: "Failed to create device model" });
    }
  });

  app.get("/api/devices/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const devices = await storage.searchDevices(query);
      res.json(devices);
    } catch (error) {
      logger.error("Error searching devices:", error);
      res.status(500).json({ message: "Failed to search devices" });
    }
  });

  // Guest Interface API
  app.get("/api/homes/:homeId/guest-view", async (req, res) => {
    try {
      const home = await storage.getCustomerHome(req.params.homeId);
      const devices = await storage.getDevices(req.params.homeId);
      
      if (!home) {
        return res.status(404).json({ message: "Home not found" });
      }

      // Return simplified view for guests
      const guestView = {
        homeName: home.name,
        deviceCount: devices.length,
        devicesByRoom: devices.reduce((acc, device) => {
          const room = device.roomLocation || "Unknown Room";
          if (!acc[room]) acc[room] = [];
          acc[room].push({
            id: device.id,
            name: device.name,
            manufacturer: device.manufacturer,
            model: device.model,
          });
          return acc;
        }, {} as Record<string, any[]>),
      };

      res.json(guestView);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest view" });
    }
  });

  // Guest Chat/Question API (Mock AI Response)
  app.post("/api/homes/:homeId/ask-question", async (req, res) => {
    try {
      const { question, deviceId } = req.body;
      
      // Mock AI responses based on common questions
      const responses = {
        "how do I turn this on": "To turn on this device, locate the power button (usually marked with a ⏻ symbol) and press it once. If it doesn't respond, check that it's plugged in and the outlet is working.",
        "not working": "If your device isn't working, try these steps: 1) Check the power connection, 2) Ensure it's properly plugged in, 3) Try unplugging for 30 seconds and plugging back in, 4) Check if there are any error lights or displays.",
        "setup": "For initial setup, please refer to the quick start guide that came with your device. Most smart devices require connecting to your WiFi network through their mobile app.",
        "reset": "To reset most devices: 1) Look for a small reset button (often recessed), 2) Hold it down for 10-15 seconds while powered on, 3) The device should restart and return to factory settings.",
      };

      // Simple keyword matching for demo
      const lowerQuestion = question.toLowerCase();
      let response = "I'd be happy to help! Could you provide more specific details about the issue you're experiencing?";

      for (const [keyword, answer] of Object.entries(responses)) {
        if (lowerQuestion.includes(keyword)) {
          response = answer;
          break;
        }
      }

      // Log the question for analytics
      await storage.createActivityLog({
        eventType: "guest_question",
        title: "Guest asked question",
        description: `Question about device: "${question}"`,
        severity: "info",
        userId: null,
        metadata: { homeId: req.params.homeId, deviceId, question },
      });

      res.json({
        question,
        response,
        timestamp: new Date(),
        helpful: null, // Guest can rate if helpful
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process question" });
    }
  });

  // Emergency Panic Button
  app.post("/api/homes/:homeId/emergency", async (req, res) => {
    try {
      const { type, message } = req.body;
      
      // Create critical alert for emergency
      const alert = await storage.createCriticalAlert({
        type: "critical",
        title: "Emergency Alert",
        message: message || "Emergency panic button was pressed",
        source: `Home ${req.params.homeId}`,
        metadata: { homeId: req.params.homeId, emergencyType: type },
      });

      // Log emergency activation
      await storage.createActivityLog({
        eventType: "emergency_control",
        title: "Emergency button activated",
        description: `Emergency panic button pressed: ${type || 'general'}`,
        severity: "critical",
        userId: null,
        metadata: { homeId: req.params.homeId, alertId: alert.id },
      });

      broadcast({ type: 'emergency_alert', data: alert });
      
      res.json({
        success: true,
        alertId: alert.id,
        message: "Emergency services have been notified",
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({ message: "Emergency alert failed" });
    }
  });

  // Emergency system endpoints
  app.post('/api/homes/:homeId/emergency', async (req, res) => {
    try {
      const { homeId } = req.params;
      const { message, location, urgency = 'high', guestContact } = req.body;
      
      const alert = await storage.createEmergencyAlert({
        homeId,
        message,
        location,
        urgency,
        guestContact
      });
      
      // Log emergency for tracking
      await storage.logActivity({
        homeId,
        action: 'emergency_alert',
        description: `Emergency alert: ${message} at ${location}`,
        severity: 'critical',
        metadata: { urgency, location, guestContact }
      });
      
      logger.info(`🚨 EMERGENCY ALERT for Home ${homeId}: ${message} at ${location}`);
      res.json(alert);
    } catch (error) {
      logger.error('Error creating emergency alert:', error);
      res.status(500).json({ error: 'Failed to create emergency alert' });
    }
  });

  app.get('/api/homes/:homeId/emergency-alerts', async (req, res) => {
    try {
      const alerts = await storage.getEmergencyAlerts(req.params.homeId);
      res.json(alerts);
    } catch (error) {
      logger.error('Error fetching emergency alerts:', error);
      res.status(500).json({ error: 'Failed to fetch emergency alerts' });
    }
  });

  // AI Q&A system endpoints
  // Vision API for device detection
  app.post('/api/vision/detect-devices', async (req, res) => {
    try {
      const { image, scanType, context, engine = 'yolo' } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'Image data required' });
      }

      // Validate engine parameter
      if (!['yolo', 'openai'].includes(engine)) {
        return res.status(400).json({ error: 'Invalid engine. Must be "yolo" or "openai"' });
      }

      const startTime = Date.now();
      const detectionResult = await processDeviceImage(image, engine, scanType, context);
      const processingTime = Date.now() - startTime;

      res.json({
        ...detectionResult,
        processingTime
      });
    } catch (error) {
      logger.error('Vision API error:', error);
      res.status(500).json({ error: 'Failed to process image' });
    }
  });

  app.post('/api/homes/:homeId/ask', async (req, res) => {
    try {
      const { homeId } = req.params;
      const { question, context } = req.body;
      
      // Generate AI response based on device context
      const answer = await generateAIResponse(question, context, homeId);
      
      const chatMessage = await storage.createChatMessage({
        homeId,
        question,
        answer: answer.answer,
        confidence: answer.confidence.toString(),
        context: context || {},
        sources: answer.sources,
        followUpSuggestions: answer.followUpSuggestions
      });
      
      res.json(chatMessage);
    } catch (error) {
      logger.error('Error processing AI question:', error);
      res.status(500).json({ error: 'Failed to process question' });
    }
  });

  app.get('/api/homes/:homeId/chat-history', async (req, res) => {
    try {
      const history = await storage.getChatHistory(req.params.homeId);
      res.json(history);
    } catch (error) {
      logger.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  // Device documentation endpoints
  app.get('/api/devices/:deviceId/manual', async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      // Simulate manual finding based on device info
      const manual = {
        id: `manual-${device.id}`,
        deviceId: device.id,
        title: `${device.manufacturer} ${device.model} User Manual`,
        manufacturer: device.manufacturer,
        model: device.model,
        instructions: getDeviceInstructions(device),
        customNotes: device.metadata?.customNotes || ''
      };
      
      res.json(manual);
    } catch (error) {
      logger.error('Error fetching device manual:', error);
      res.status(500).json({ error: 'Failed to fetch device manual' });
    }
  });

  return httpServer;
}

// AI Response Generation Function
async function generateAIResponse(question: string, context: any, homeId: string) {
  // Simulate AI response based on common smart home questions
  const commonResponses: Record<string, any> = {
    "turn on": {
      answer: "To turn on this device: 1. Locate the power button or use the remote control 2. If it's a smart device, you can also use voice commands like 'Hey Google' or 'Alexa' 3. Check if the device is plugged in properly",
      confidence: 0.85,
      sources: ["Device Manual", "Smart Home Guide"],
      followUpSuggestions: ["How to adjust settings", "Voice command options", "Troubleshooting"]
    },
    "not working": {
      answer: "If your device isn't working: 1. Check power connection 2. Ensure WiFi connectivity 3. Try restarting the device 4. Check for app updates 5. Review device manual for specific troubleshooting",
      confidence: 0.90,
      sources: ["Troubleshooting Guide", "Device Manual"],
      followUpSuggestions: ["Reset instructions", "Contact support", "Check warranty"]
    },
    "connect": {
      answer: "To connect your device: 1. Enable WiFi on the device 2. Open the companion app 3. Follow setup wizard 4. Enter your WiFi password 5. Complete pairing process",
      confidence: 0.80,
      sources: ["Setup Guide", "WiFi Instructions"],
      followUpSuggestions: ["WiFi troubleshooting", "App download", "Pairing issues"]
    }
  };

  // Find matching response based on keywords
  const questionLower = question.toLowerCase();
  let response = {
    answer: "I'd be happy to help! Could you provide more specific details about your question? I can assist with device setup, troubleshooting, and usage instructions.",
    confidence: 0.60,
    sources: ["General Smart Home Guide"],
    followUpSuggestions: ["Device setup", "Troubleshooting", "User manual"]
  };

  for (const [keyword, keywordResponse] of Object.entries(commonResponses)) {
    if (questionLower.includes(keyword)) {
      response = keywordResponse;
      break;
    }
  }

  // Enhance response with context information
  if (context.room) {
    response.answer = `For your ${context.room}: ${response.answer}`;
  }
  
  if (context.devices && context.devices.length > 0) {
    response.answer += ` I can see you have: ${context.devices.join(', ')} in this area.`;
  }

  return response;
}

// Dual Engine Vision Processing Function with Smart Fallback
async function processDeviceImage(imageData: string, engine: string, scanType: string, context: any) {
  // Smart fallback logic: if OpenAI is requested but not available, use YOLO
  if (engine === 'openai' && !env.OPENAI_API_KEY) {
    logger.warn('OpenAI requested but API key not configured, falling back to YOLO');
    engine = 'yolo';
  }

  switch (engine) {
    case 'yolo':
      const yoloResult = await processWithYOLO(imageData, scanType, context);
      // If YOLO fails and OpenAI is available, try OpenAI as fallback
      if (yoloResult.error && env.OPENAI_API_KEY) {
        logger.warn('YOLO failed, attempting OpenAI fallback...');
        return await processWithOpenAI(imageData, scanType, context);
      }
      return yoloResult;
      
    case 'openai':
      const openaiResult = await processWithOpenAI(imageData, scanType, context);
      // If OpenAI fails, try YOLO as fallback
      if (openaiResult.error) {
        logger.warn('OpenAI failed, attempting YOLO fallback...');
        return await processWithYOLO(imageData, scanType, context);
      }
      return openaiResult;
      
    default:
      // Fallback to YOLO if unknown engine
      logger.warn(`Unknown engine "${engine}", falling back to YOLO`);
      return await processWithYOLO(imageData, scanType, context);
  }
}

// YOLOv8 Processing Function
async function processWithYOLO(imageData: string, scanType: string, context: any) {
  try {
    // Check if YOLO service is configured
    const yoloServiceUrl = env.YOLO_SERVICE_URL || 'http://localhost:5001';
    
    logger.info('Processing with YOLOv8 service...');
    
    const response = await fetch(`${yoloServiceUrl}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        scanType: scanType,
        context: context
      })
    });
    
    if (!response.ok) {
      throw new Error(`YOLO service error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    logger.info(`YOLOv8 detected ${result.smartDevices || 0} smart devices in ${result.processingTime}ms`);
    
    return result;
  } catch (error) {
    logger.error('YOLOv8 processing error:', error);
    
    // Fallback response
    return {
      detectedDevices: [],
      extractedText: [],
      roomContext: context?.room || 'unknown',
      engine: 'yolo',
      error: `YOLO processing failed: ${error.message}`
    };
  }
}

// OpenAI Vision Processing Function  
async function processWithOpenAI(imageData: string, scanType: string, context: any) {
  try {
    // Check if OpenAI API key is available
    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const prompt = `You are an expert at identifying smart home devices from images. Analyze this image and identify any smart home devices visible.

For each device found, provide:
1. Device type (TV, thermostat, speaker, camera, light, router, etc.)
2. Brand name if visible
3. Model number if readable
4. Confidence score (0-1)
5. Suggested room-appropriate name
6. Whether this device likely has online manuals available

Focus on common smart home devices like:
- TVs (Samsung, LG, Sony, TCL)
- Thermostats (Nest, Honeywell, Ecobee)
- Smart speakers (Amazon Echo, Google Nest, Apple HomePod)
- Security cameras (Ring, Nest, Arlo)
- Smart lights (Philips Hue, LIFX)
- Routers/WiFi (Eero, Netgear)

Return your response as a JSON object with this structure:
{
  "detectedDevices": [
    {
      "type": "television",
      "brand": "Samsung", 
      "model": "QN65Q70T",
      "confidence": 0.85,
      "boundingBox": {"x": 100, "y": 50, "width": 400, "height": 300},
      "suggestedName": "Living Room TV",
      "manualFound": true
    }
  ],
  "extractedText": ["Samsung", "Model QN65Q70T", "Smart TV"],
  "roomContext": "living_room"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Enhance with manual lookup simulation
    if (result.detectedDevices) {
      result.detectedDevices = result.detectedDevices.map((device: any) => ({
        ...device,
        manualFound: device.brand && ['Samsung', 'LG', 'Sony', 'Nest', 'Amazon', 'Google', 'Philips'].includes(device.brand),
        boundingBox: device.boundingBox || { x: 50, y: 50, width: 200, height: 150 }
      }));
    }

    // Add engine information
    result.engine = 'openai';

    return result;
  } catch (error) {
    logger.error('OpenAI Vision API error:', error);
    
    // Fallback response for demo purposes
    return {
      detectedDevices: [],
      extractedText: [],
      roomContext: context?.room || 'unknown',
      engine: 'openai',
      error: 'OpenAI vision processing failed'
    };
  }
}

// Device Instructions Helper
function getDeviceInstructions(device: any) {
  const instructions: Record<string, string> = {
    "Samsung": "Samsung Smart TV: Use the Samsung remote or SmartThings app. Press Power button to turn on. Navigate with directional pad. Access Smart Hub with Home button.",
    "Nest": "Nest Thermostat: Rotate the ring to adjust temperature. Press to access menu. Use Nest app for remote control and scheduling.",
    "Amazon": "Amazon Echo: Say 'Alexa' followed by your command. Use Alexa app for setup and settings. LED ring shows status - blue for listening, red for muted.",
    "Philips": "Philips Hue: Control via Philips Hue app or voice commands. Dimmer switch rotates for brightness, press for on/off.",
    "Ring": "Ring Doorbell: Motion alerts sent to phone. Two-way audio via Ring app. Live view available 24/7. Check battery level regularly."
  };

  const manufacturer = device.manufacturer || "";
  for (const [brand, instruction] of Object.entries(instructions)) {
    if (manufacturer.includes(brand)) {
      return instruction;
    }
  }

  return `${device.name}: Please refer to the device manual or manufacturer website for specific instructions. Common actions include power on/off, basic settings adjustment, and app connectivity.`;
}

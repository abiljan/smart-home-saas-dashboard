import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertCriticalAlertSchema,
  insertActivityLogSchema,
  insertSystemMetricSchema,
  insertSystemHealthSchema,
  insertCustomerHomeSchema,
  insertDeviceSchema,
  insertDeviceDocumentationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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

      console.log('Dashboard metrics updated via real-time simulation');
    } catch (error) {
      console.error('Error in real-time update simulation:', error);
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

      broadcast({ type: 'device_added', data: device });
      res.json(device);
    } catch (error) {
      res.status(400).json({ message: "Failed to create device" });
    }
  });

  // Device Discovery Simulation
  app.post("/api/homes/:homeId/scan-wifi", async (req, res) => {
    try {
      // Simulate WiFi device discovery
      const mockDevices = [
        { name: "Smart TV", manufacturer: "Samsung", model: "QN65Q70T", roomLocation: "Living Room" },
        { name: "WiFi Router", manufacturer: "Netgear", model: "AX6000", roomLocation: "Office" },
        { name: "Smart Thermostat", manufacturer: "Nest", model: "Learning", roomLocation: "Hallway" },
        { name: "Security Camera", manufacturer: "Ring", model: "Stick Up Cam", roomLocation: "Front Door" },
      ];

      // Randomly return 1-3 devices
      const discoveredDevices = mockDevices
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);

      res.json({ 
        discovered: discoveredDevices,
        scanTime: new Date(),
        method: "wifi_scan"
      });
    } catch (error) {
      res.status(500).json({ message: "WiFi scan failed" });
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
      
      console.log(`🚨 EMERGENCY ALERT for Home ${homeId}: ${message} at ${location}`);
      res.json(alert);
    } catch (error) {
      console.error('Error creating emergency alert:', error);
      res.status(500).json({ error: 'Failed to create emergency alert' });
    }
  });

  app.get('/api/homes/:homeId/emergency-alerts', async (req, res) => {
    try {
      const alerts = await storage.getEmergencyAlerts(req.params.homeId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      res.status(500).json({ error: 'Failed to fetch emergency alerts' });
    }
  });

  // AI Q&A system endpoints
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
        confidence: answer.confidence,
        context: context || {},
        sources: answer.sources,
        followUpSuggestions: answer.followUpSuggestions
      });
      
      res.json(chatMessage);
    } catch (error) {
      console.error('Error processing AI question:', error);
      res.status(500).json({ error: 'Failed to process question' });
    }
  });

  app.get('/api/homes/:homeId/chat-history', async (req, res) => {
    try {
      const history = await storage.getChatHistory(req.params.homeId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
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
      console.error('Error fetching device manual:', error);
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

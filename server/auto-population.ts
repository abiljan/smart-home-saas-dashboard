import { logger } from "./config";
import { storage } from "./storage";
import { deviceDatabase } from "./device-database";

interface DevicePopulationData {
  device: any;
  manualInfo?: ManualInfo;
  setupInstructions?: SetupInstruction[];
  troubleshooting?: TroubleshootingTip[];
  compatibleDevices?: string[];
  features?: DeviceFeature[];
  specifications?: DeviceSpecification[];
}

interface ManualInfo {
  url?: string;
  title?: string;
  source?: string;
  downloadUrl?: string;
  pdfContent?: string;
  lastUpdated?: Date;
}

interface SetupInstruction {
  step: number;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime?: string;
}

interface TroubleshootingTip {
  issue: string;
  solution: string;
  priority: 'low' | 'medium' | 'high';
  category: 'connectivity' | 'setup' | 'usage' | 'maintenance';
}

interface DeviceFeature {
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface DeviceSpecification {
  name: string;
  value: string;
  unit?: string;
  category: 'power' | 'connectivity' | 'physical' | 'performance';
}

export class AutoPopulationService {
  private readonly knowledgeBase: Record<string, any> = {};
  
  constructor() {
    this.initializeKnowledgeBase();
    logger.info('Auto-population service initialized');
  }

  /**
   * Automatically populate device information after discovery
   */
  async populateDeviceInfo(deviceId: string, discoveryMethod: string, homeId: string): Promise<DevicePopulationData> {
    try {
      logger.info(`Auto-populating device info for ${deviceId} (discovered via ${discoveryMethod})`);

      // Get the device from storage
      const device = await storage.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const populationData: DevicePopulationData = { device };

      // Step 1: Populate manual information
      populationData.manualInfo = await this.findManualInformation(device);

      // Step 2: Generate setup instructions
      populationData.setupInstructions = await this.generateSetupInstructions(device);

      // Step 3: Create troubleshooting tips
      populationData.troubleshooting = await this.generateTroubleshootingTips(device);

      // Step 4: Find compatible devices
      populationData.compatibleDevices = await this.findCompatibleDevices(device, homeId);

      // Step 5: Populate device features
      populationData.features = await this.populateDeviceFeatures(device);

      // Step 6: Add detailed specifications
      populationData.specifications = await this.populateSpecifications(device);

      // Save all the populated data
      await this.savePopulatedData(deviceId, populationData);

      logger.info(`Successfully auto-populated data for device: ${device.name}`);
      return populationData;

    } catch (error) {
      logger.error(`Auto-population failed for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Find manual information for a device
   */
  private async findManualInformation(device: any): Promise<ManualInfo | undefined> {
    try {
      const { manufacturer, model } = device;
      
      // Check common manual sources
      const manualSources = [
        `https://www.${manufacturer.toLowerCase().replace(/\s+/g, '')}.com/support`,
        `https://manuals.${manufacturer.toLowerCase().replace(/\s+/g, '')}.com`,
        `https://support.${manufacturer.toLowerCase().replace(/\s+/g, '')}.com`,
        `https://www.manualslib.com/manual/${model.toLowerCase().replace(/\s+/g, '-')}`
      ];

      // Try manufacturer-specific patterns
      const manualUrl = this.getManufacturerManualUrl(manufacturer, model);
      if (manualUrl) {
        return {
          url: manualUrl,
          title: `${manufacturer} ${model} User Manual`,
          source: 'Manufacturer Website',
          lastUpdated: new Date()
        };
      }

      // Return generic manual info
      return {
        title: `${manufacturer} ${model} Manual`,
        source: 'Auto-generated',
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.warn('Manual information lookup failed:', error);
      return undefined;
    }
  }

  /**
   * Generate setup instructions based on device type and category
   */
  private async generateSetupInstructions(device: any): Promise<SetupInstruction[]> {
    const { category, type, manufacturer } = device;
    
    const baseInstructions = this.getBaseInstructionsForCategory(category);
    const manufacturerInstructions = this.getManufacturerSpecificInstructions(manufacturer, type);
    
    return [...baseInstructions, ...manufacturerInstructions].map((instruction, index) => ({
      step: index + 1,
      ...instruction
    }));
  }

  /**
   * Generate troubleshooting tips
   */
  private async generateTroubleshootingTips(device: any): Promise<TroubleshootingTip[]> {
    const { category, type, manufacturer } = device;
    
    const commonTips = this.getCommonTroubleshootingTips(category);
    const specificTips = this.getManufacturerTroubleshootingTips(manufacturer, type);
    
    return [...commonTips, ...specificTips];
  }

  /**
   * Find compatible devices in the same home
   */
  private async findCompatibleDevices(device: any, homeId: string): Promise<string[]> {
    try {
      const homeDevices = await storage.getDevicesByHome(homeId);
      const compatibilityRules = this.getCompatibilityRules(device.category, device.manufacturer);
      
      const compatible = homeDevices.filter(otherDevice => 
        otherDevice.id !== device.id &&
        this.areDevicesCompatible(device, otherDevice, compatibilityRules)
      ).map(d => d.name);

      return compatible;
    } catch (error) {
      logger.warn('Compatible devices lookup failed:', error);
      return [];
    }
  }

  /**
   * Populate device features
   */
  private async populateDeviceFeatures(device: any): Promise<DeviceFeature[]> {
    const features = this.getFeaturesByCategory(device.category, device.manufacturer, device.model);
    return features;
  }

  /**
   * Populate detailed specifications
   */
  private async populateSpecifications(device: any): Promise<DeviceSpecification[]> {
    const specs = this.getSpecificationsByCategory(device.category, device.manufacturer, device.model);
    return specs;
  }

  /**
   * Save populated data to storage
   */
  private async savePopulatedData(deviceId: string, data: DevicePopulationData): Promise<void> {
    try {
      // Save manual information
      if (data.manualInfo) {
        await storage.createDeviceDocumentation({
          deviceId,
          content: JSON.stringify(data.manualInfo),
          source: data.manualInfo.source || 'Auto-population',
          documentType: 'manual',
          title: data.manualInfo.title
        });
      }

      // Save setup instructions
      if (data.setupInstructions && data.setupInstructions.length > 0) {
        await storage.createDeviceDocumentation({
          deviceId,
          content: JSON.stringify(data.setupInstructions),
          source: 'Auto-population',
          documentType: 'setup_guide',
          title: `${data.device.name} Setup Instructions`
        });
      }

      // Save troubleshooting tips
      if (data.troubleshooting && data.troubleshooting.length > 0) {
        await storage.createDeviceDocumentation({
          deviceId,
          content: JSON.stringify(data.troubleshooting),
          source: 'Auto-population',
          documentType: 'troubleshooting',
          title: `${data.device.name} Troubleshooting Guide`
        });
      }

      // Update device with populated metadata
      await storage.updateDevice(deviceId, {
        metadata: {
          ...data.device.metadata,
          autoPopulated: true,
          populatedAt: new Date().toISOString(),
          features: data.features,
          specifications: data.specifications,
          compatibleDevices: data.compatibleDevices
        }
      });

    } catch (error) {
      logger.error('Failed to save populated data:', error);
      throw error;
    }
  }

  /**
   * Initialize knowledge base with device information
   */
  private initializeKnowledgeBase(): void {
    // TV/Entertainment setup instructions
    this.knowledgeBase.tv_instructions = [
      {
        title: "Unbox and Place TV",
        description: "Remove TV from packaging and place on stable surface or mount",
        difficulty: 'easy',
        estimatedTime: '10-15 minutes'
      },
      {
        title: "Connect Power",
        description: "Plug power cord into TV and wall outlet",
        difficulty: 'easy',
        estimatedTime: '2 minutes'
      },
      {
        title: "Connect to WiFi",
        description: "Navigate to Settings > Network > WiFi and select your network",
        difficulty: 'medium',
        estimatedTime: '5 minutes'
      },
      {
        title: "Update Software", 
        description: "Check for and install any available system updates",
        difficulty: 'easy',
        estimatedTime: '10-20 minutes'
      },
      {
        title: "Sign in to Apps",
        description: "Download and sign in to your streaming apps",
        difficulty: 'easy',
        estimatedTime: '15 minutes'
      }
    ];

    // Smart thermostat instructions
    this.knowledgeBase.thermostat_instructions = [
      {
        title: "Turn Off Power",
        description: "Turn off power to your HVAC system at the circuit breaker",
        difficulty: 'medium',
        estimatedTime: '2 minutes'
      },
      {
        title: "Remove Old Thermostat",
        description: "Take a photo of existing wiring, then disconnect old thermostat",
        difficulty: 'medium',
        estimatedTime: '10 minutes'
      },
      {
        title: "Install Base Plate",
        description: "Mount the new base plate to wall and connect wires",
        difficulty: 'hard',
        estimatedTime: '20 minutes'
      },
      {
        title: "Attach Display",
        description: "Snap the display unit onto the base plate",
        difficulty: 'easy',
        estimatedTime: '2 minutes'
      },
      {
        title: "Configure Settings",
        description: "Use the app to connect to WiFi and configure temperature settings",
        difficulty: 'medium',
        estimatedTime: '15 minutes'
      }
    ];

    // Common troubleshooting tips
    this.knowledgeBase.common_troubleshooting = {
      connectivity: [
        { issue: "Device won't connect to WiFi", solution: "Check WiFi password, move closer to router, restart device", priority: 'high' },
        { issue: "Intermittent connection drops", solution: "Check router firmware, consider WiFi extender", priority: 'medium' },
        { issue: "Slow response times", solution: "Check network bandwidth, restart router", priority: 'medium' }
      ],
      setup: [
        { issue: "App can't find device", solution: "Ensure device is in pairing mode, check Bluetooth/WiFi", priority: 'high' },
        { issue: "Setup fails during configuration", solution: "Restart app and device, check account permissions", priority: 'medium' },
        { issue: "Device appears offline after setup", solution: "Check power connection, network settings", priority: 'high' }
      ]
    };
  }

  private getManufacturerManualUrl(manufacturer: string, model: string): string | undefined {
    const manualUrls: Record<string, (model: string) => string> = {
      'Samsung': (model) => `https://www.samsung.com/us/support/owners/product/${model.toLowerCase().replace(/\s+/g, '-')}`,
      'LG': (model) => `https://www.lg.com/us/support/product/lg-${model.toLowerCase().replace(/\s+/g, '-')}`,
      'Sony': (model) => `https://www.sony.com/electronics/support/${model.toLowerCase().replace(/\s+/g, '-')}`,
      'Google': (model) => `https://support.google.com/googlenest/?product=${model.toLowerCase().replace(/\s+/g, '_')}`,
      'Amazon': (model) => `https://www.amazon.com/gp/help/customer/display.html?nodeId=AMAZON_ECHO_HELP`,
      'Ring': (model) => `https://support.ring.com/hc/en-us/categories/360002347611-${model.toLowerCase().replace(/\s+/g, '-')}`,
      'Philips': (model) => `https://www.philips.com/c-p/${model.toLowerCase().replace(/\s+/g, '_')}/support`
    };

    const urlGenerator = manualUrls[manufacturer];
    return urlGenerator ? urlGenerator(model) : undefined;
  }

  private getBaseInstructionsForCategory(category: string): Partial<SetupInstruction>[] {
    const instructions: Record<string, Partial<SetupInstruction>[]> = {
      'tv': this.knowledgeBase.tv_instructions,
      'climate_control': this.knowledgeBase.thermostat_instructions,
      'voice_assistant': [
        { title: "Plug in Device", description: "Connect power adapter and plug into wall outlet", difficulty: 'easy', estimatedTime: '1 minute' },
        { title: "Download App", description: "Download manufacturer app on your phone", difficulty: 'easy', estimatedTime: '3 minutes' },
        { title: "Connect to WiFi", description: "Follow app instructions to connect device to WiFi", difficulty: 'medium', estimatedTime: '5 minutes' },
        { title: "Test Voice Commands", description: "Try basic voice commands to ensure setup is working", difficulty: 'easy', estimatedTime: '3 minutes' }
      ],
      'lighting': [
        { title: "Install Bulb/Fixture", description: "Install smart bulb or replace existing fixture", difficulty: 'easy', estimatedTime: '5 minutes' },
        { title: "Download App", description: "Download manufacturer app for setup and control", difficulty: 'easy', estimatedTime: '3 minutes' },
        { title: "Connect to Network", description: "Follow app instructions to add device to network", difficulty: 'medium', estimatedTime: '5 minutes' },
        { title: "Create Scenes", description: "Set up lighting scenes and schedules", difficulty: 'easy', estimatedTime: '10 minutes' }
      ]
    };

    return instructions[category] || [
      { title: "Basic Setup", description: "Follow manufacturer instructions for initial setup", difficulty: 'medium', estimatedTime: '15 minutes' },
      { title: "Connect to Network", description: "Connect device to your home network", difficulty: 'medium', estimatedTime: '5 minutes' },
      { title: "Configure Settings", description: "Adjust device settings through app or interface", difficulty: 'medium', estimatedTime: '10 minutes' }
    ];
  }

  private getManufacturerSpecificInstructions(manufacturer: string, type: string): Partial<SetupInstruction>[] {
    // Add manufacturer-specific setup steps
    if (manufacturer.toLowerCase() === 'google' || manufacturer.toLowerCase() === 'nest') {
      return [
        { title: "Sign in to Google Account", description: "Use Google account to enable full smart home integration", difficulty: 'easy', estimatedTime: '3 minutes' }
      ];
    }

    if (manufacturer.toLowerCase() === 'amazon') {
      return [
        { title: "Sign in to Amazon Account", description: "Connect with Amazon account for Alexa integration", difficulty: 'easy', estimatedTime: '3 minutes' }
      ];
    }

    return [];
  }

  private getCommonTroubleshootingTips(category: string): TroubleshootingTip[] {
    const baseTips = this.knowledgeBase.common_troubleshooting;
    return [...baseTips.connectivity, ...baseTips.setup].map(tip => ({
      ...tip,
      category: tip.category || 'setup'
    })) as TroubleshootingTip[];
  }

  private getManufacturerTroubleshootingTips(manufacturer: string, type: string): TroubleshootingTip[] {
    // Manufacturer-specific troubleshooting
    return [];
  }

  private getCompatibilityRules(category: string, manufacturer: string): any {
    return {
      sameManufacturer: true,
      sameEcosystem: ['voice_assistant', 'lighting', 'security'].includes(category),
      crossCompatible: category === 'voice_assistant' // Voice assistants work with many devices
    };
  }

  private areDevicesCompatible(device1: any, device2: any, rules: any): boolean {
    if (rules.sameManufacturer && device1.manufacturer === device2.manufacturer) return true;
    if (rules.sameEcosystem && device1.category === device2.category) return true;
    if (rules.crossCompatible && (device1.category === 'voice_assistant' || device2.category === 'voice_assistant')) return true;
    return false;
  }

  private getFeaturesByCategory(category: string, manufacturer: string, model: string): DeviceFeature[] {
    const commonFeatures: Record<string, DeviceFeature[]> = {
      'tv': [
        { name: 'Smart TV Apps', description: 'Access streaming apps and services', category: 'entertainment', enabled: true },
        { name: 'Voice Control', description: 'Control TV with voice commands', category: 'control', enabled: true },
        { name: 'Screen Mirroring', description: 'Cast content from mobile devices', category: 'connectivity', enabled: true },
        { name: '4K Resolution', description: 'Ultra HD video quality', category: 'display', enabled: true }
      ],
      'voice_assistant': [
        { name: 'Voice Commands', description: 'Respond to voice queries and commands', category: 'core', enabled: true },
        { name: 'Smart Home Control', description: 'Control compatible smart devices', category: 'automation', enabled: true },
        { name: 'Music Streaming', description: 'Play music from various services', category: 'entertainment', enabled: true },
        { name: 'Skills/Actions', description: 'Extended functionality through third-party skills', category: 'extensibility', enabled: true }
      ],
      'climate_control': [
        { name: 'Schedule Programming', description: 'Automatic temperature scheduling', category: 'automation', enabled: true },
        { name: 'Remote Control', description: 'Control from mobile app', category: 'control', enabled: true },
        { name: 'Energy Reports', description: 'Track energy usage and savings', category: 'efficiency', enabled: true },
        { name: 'Geofencing', description: 'Adjust temperature based on location', category: 'automation', enabled: false }
      ]
    };

    return commonFeatures[category] || [];
  }

  private getSpecificationsByCategory(category: string, manufacturer: string, model: string): DeviceSpecification[] {
    const commonSpecs: Record<string, DeviceSpecification[]> = {
      'tv': [
        { name: 'Screen Size', value: '65', unit: 'inches', category: 'physical' },
        { name: 'Resolution', value: '4K UHD', category: 'performance' },
        { name: 'Power Consumption', value: '120', unit: 'watts', category: 'power' },
        { name: 'WiFi', value: '802.11ac', category: 'connectivity' }
      ],
      'voice_assistant': [
        { name: 'Dimensions', value: '3.9 x 3.9 x 4.3', unit: 'inches', category: 'physical' },
        { name: 'Weight', value: '12.8', unit: 'oz', category: 'physical' },
        { name: 'WiFi', value: '802.11a/b/g/n/ac', category: 'connectivity' },
        { name: 'Bluetooth', value: 'Yes', category: 'connectivity' }
      ],
      'climate_control': [
        { name: 'Temperature Range', value: '45-95', unit: '°F', category: 'performance' },
        { name: 'Humidity Control', value: 'Yes', category: 'performance' },
        { name: 'WiFi', value: '802.11n', category: 'connectivity' },
        { name: 'Power', value: '24V AC', category: 'power' }
      ]
    };

    return commonSpecs[category] || [];
  }
}

export const autoPopulation = new AutoPopulationService();
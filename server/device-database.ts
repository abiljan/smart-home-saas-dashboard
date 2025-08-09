import { logger } from "./config";

interface DeviceInfo {
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  type: string;
  specifications?: Record<string, any>;
  manualUrl?: string;
  imageUrl?: string;
  features?: string[];
}

interface DeviceApiResponse {
  success: boolean;
  device?: DeviceInfo;
  message?: string;
  source?: string;
}

export class DeviceDatabaseService {
  private readonly apiSources = {
    // UPC Database API (free tier available)
    upcDatabase: {
      name: 'UPC Database',
      baseUrl: 'https://api.upcitemdb.com/prod/trial/lookup',
      enabled: true,
      free: true
    },
    
    // Open Food Facts (for appliances with food-related functions)
    openFoodFacts: {
      name: 'Open Food Facts',
      baseUrl: 'https://world.openfoodfacts.org/api/v0/product',
      enabled: true,
      free: true
    },
    
    // Device Atlas (would require API key)
    deviceAtlas: {
      name: 'Device Atlas',
      baseUrl: 'https://deviceatlas.com/api',
      enabled: false, // Requires paid API key
      free: false
    },
    
    // Manual database (local fallback)
    localDatabase: {
      name: 'Local Database',
      enabled: true,
      free: true
    }
  };

  constructor() {
    logger.info('Device Database Service initialized with sources:', Object.keys(this.apiSources));
  }

  /**
   * Look up device information by UPC/EAN barcode
   */
  async lookupByBarcode(barcode: string): Promise<DeviceApiResponse> {
    try {
      logger.info(`Looking up barcode: ${barcode}`);

      // Try UPC Database API first (free tier)
      if (this.apiSources.upcDatabase.enabled) {
        const upcResult = await this.queryUPCDatabase(barcode);
        if (upcResult.success) {
          return upcResult;
        }
      }

      // Fallback to local database
      return this.queryLocalDatabase(barcode, 'barcode');

    } catch (error) {
      logger.error('Barcode lookup failed:', error);
      return {
        success: false,
        message: 'Device lookup service temporarily unavailable'
      };
    }
  }

  /**
   * Look up device information by QR code content
   */
  async lookupByQRCode(qrContent: string): Promise<DeviceApiResponse> {
    try {
      logger.info(`Looking up QR code: ${qrContent.substring(0, 50)}...`);

      // Parse QR content - could be URL, JSON, or plain text
      if (qrContent.startsWith('http')) {
        return this.parseDeviceURL(qrContent);
      } else if (qrContent.startsWith('{')) {
        return this.parseDeviceJSON(qrContent);
      } else {
        // Treat as model/serial number
        return this.queryLocalDatabase(qrContent, 'qr');
      }

    } catch (error) {
      logger.error('QR code lookup failed:', error);
      return {
        success: false,
        message: 'QR code parsing failed'
      };
    }
  }

  /**
   * Query UPC Database API (free tier)
   */
  private async queryUPCDatabase(barcode: string): Promise<DeviceApiResponse> {
    try {
      const response = await fetch(`${this.apiSources.upcDatabase.baseUrl}?upc=${barcode}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`UPC API responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 'OK' && data.items && data.items.length > 0) {
        const item = data.items[0];
        
        // Map UPC data to our device format
        const device = this.mapUPCDataToDevice(item);
        
        logger.info(`Found device via UPC API: ${device.name}`);
        return {
          success: true,
          device,
          source: 'UPC Database'
        };
      }

      return {
        success: false,
        message: 'Product not found in UPC database'
      };

    } catch (error) {
      logger.warn('UPC Database query failed:', error);
      return {
        success: false,
        message: 'UPC Database service unavailable'
      };
    }
  }

  /**
   * Parse device information from URL (manufacturer websites, support pages)
   */
  private async parseDeviceURL(url: string): Promise<DeviceApiResponse> {
    try {
      // Extract manufacturer and model from common URL patterns
      const patterns = {
        samsung: /samsung\.com.*\/([a-zA-Z0-9\-]+)/i,
        lg: /lg\.com.*\/([a-zA-Z0-9\-]+)/i,
        sony: /sony\.com.*\/([a-zA-Z0-9\-]+)/i,
        apple: /apple\.com.*\/([a-zA-Z0-9\-]+)/i,
        google: /google\.com.*\/([a-zA-Z0-9\-]+)/i,
        amazon: /amazon\.com.*\/([a-zA-Z0-9\-]+)/i,
        nest: /nest\.com.*\/([a-zA-Z0-9\-]+)/i,
        ring: /ring\.com.*\/([a-zA-Z0-9\-]+)/i,
        philips: /philips\.com.*\/([a-zA-Z0-9\-]+)/i
      };

      for (const [manufacturer, pattern] of Object.entries(patterns)) {
        const match = url.match(pattern);
        if (match) {
          const model = match[1].replace(/-/g, ' ').toUpperCase();
          
          // Look up in local database by manufacturer/model
          const localResult = this.queryLocalDatabase(`${manufacturer} ${model}`, 'qr');
          if (localResult.success) {
            return localResult;
          }

          // Create basic device info from URL
          return {
            success: true,
            device: {
              name: `${manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1)} ${model}`,
              manufacturer: manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1),
              model: model,
              category: this.inferCategoryFromModel(model),
              type: 'unknown',
              manualUrl: url.includes('support') || url.includes('manual') ? url : undefined
            },
            source: 'URL Analysis'
          };
        }
      }

      return {
        success: false,
        message: 'Could not parse device information from URL'
      };

    } catch (error) {
      logger.error('URL parsing failed:', error);
      return {
        success: false,
        message: 'URL parsing failed'
      };
    }
  }

  /**
   * Parse device information from JSON QR content
   */
  private parseDeviceJSON(jsonContent: string): Promise<DeviceApiResponse> {
    try {
      const data = JSON.parse(jsonContent);
      
      // Look for common device information fields
      const device: DeviceInfo = {
        name: data.name || data.productName || data.model || 'Unknown Device',
        manufacturer: data.manufacturer || data.brand || data.company || 'Unknown',
        model: data.model || data.modelNumber || data.sku || 'Unknown',
        category: data.category || this.inferCategoryFromModel(data.model || ''),
        type: data.type || 'unknown',
        specifications: data.specs || data.specifications,
        manualUrl: data.manualUrl || data.supportUrl,
        imageUrl: data.imageUrl || data.photo,
        features: data.features
      };

      logger.info(`Parsed device from JSON: ${device.name}`);
      return Promise.resolve({
        success: true,
        device,
        source: 'QR JSON Data'
      });

    } catch (error) {
      logger.error('JSON parsing failed:', error);
      return Promise.resolve({
        success: false,
        message: 'Invalid JSON in QR code'
      });
    }
  }

  /**
   * Query local device database (fallback)
   */
  private queryLocalDatabase(query: string, type: 'barcode' | 'qr'): DeviceApiResponse {
    const localDatabase: Record<string, DeviceInfo> = {
      // Popular TV barcodes/models
      "012345678905": {
        name: "Samsung 65\" QLED TV",
        manufacturer: "Samsung",
        model: "QN65Q70T",
        category: "tv",
        type: "television",
        features: ["4K", "HDR", "Smart TV", "Voice Control"],
        manualUrl: "https://www.samsung.com/us/support/owners/product/qn65q70t"
      },
      
      // Smart home devices
      "023456789012": {
        name: "Google Nest Learning Thermostat",
        manufacturer: "Google",
        model: "Learning 3rd Gen",
        category: "climate_control",
        type: "thermostat",
        features: ["Learning", "WiFi", "Energy Saving", "App Control"],
        manualUrl: "https://nest.com/support/thermostat"
      },
      
      "034567890123": {
        name: "Amazon Echo Dot",
        manufacturer: "Amazon", 
        model: "4th Gen",
        category: "voice_assistant",
        type: "smart_speaker",
        features: ["Alexa", "Voice Control", "Music Streaming", "Smart Home Hub"],
        manualUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=201549830"
      },

      // Common QR patterns
      "samsung qn65q70t": {
        name: "Samsung QLED TV",
        manufacturer: "Samsung",
        model: "QN65Q70T",
        category: "tv",
        type: "television"
      },
      
      "google learning": {
        name: "Nest Learning Thermostat",
        manufacturer: "Google",
        model: "Learning",
        category: "climate_control", 
        type: "thermostat"
      },

      "ring doorbell": {
        name: "Ring Video Doorbell",
        manufacturer: "Ring",
        model: "Video Doorbell Pro",
        category: "security",
        type: "doorbell"
      },

      "philips hue": {
        name: "Philips Hue Smart Bulb",
        manufacturer: "Philips",
        model: "Hue White and Color",
        category: "lighting",
        type: "smart_bulb"
      }
    };

    const device = localDatabase[query.toLowerCase()];
    
    if (device) {
      logger.info(`Found device in local database: ${device.name}`);
      return {
        success: true,
        device,
        source: 'Local Database'
      };
    }

    return {
      success: false,
      message: `No device found for ${type}: ${query}`,
    };
  }

  /**
   * Map UPC API data to our device format
   */
  private mapUPCDataToDevice(upcItem: any): DeviceInfo {
    const title = upcItem.title || '';
    const brand = upcItem.brand || '';
    
    // Try to extract manufacturer and model from title
    const manufacturer = brand || this.extractManufacturerFromTitle(title);
    const model = this.extractModelFromTitle(title, manufacturer);
    const category = this.inferCategoryFromTitle(title);
    
    return {
      name: title,
      manufacturer,
      model: model || 'Unknown Model',
      category,
      type: this.mapCategoryToType(category),
      specifications: {
        upc: upcItem.upc,
        ean: upcItem.ean,
        description: upcItem.description,
        weight: upcItem.weight,
        dimensions: upcItem.dimension
      },
      imageUrl: upcItem.images?.[0] || upcItem.image
    };
  }

  /**
   * Extract manufacturer from product title
   */
  private extractManufacturerFromTitle(title: string): string {
    const commonBrands = ['Samsung', 'LG', 'Sony', 'Apple', 'Google', 'Amazon', 'Ring', 'Nest', 'Philips', 'TP-Link', 'Netgear'];
    
    for (const brand of commonBrands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    // Extract first word as potential manufacturer
    const words = title.split(' ');
    return words[0] || 'Unknown';
  }

  /**
   * Extract model from title
   */
  private extractModelFromTitle(title: string, manufacturer: string): string {
    // Remove manufacturer from title and extract model-like patterns
    let cleanTitle = title.replace(new RegExp(manufacturer, 'i'), '').trim();
    
    // Look for model patterns (alphanumeric with dashes/underscores)
    const modelMatch = cleanTitle.match(/([A-Z0-9][\w\-]{2,15})/i);
    return modelMatch ? modelMatch[1] : cleanTitle.split(' ')[0] || 'Unknown';
  }

  /**
   * Infer device category from title/model
   */
  private inferCategoryFromTitle(title: string): string {
    const categoryKeywords = {
      'tv': ['tv', 'television', 'smart tv', 'qled', 'oled', 'led tv'],
      'smart_appliance': ['refrigerator', 'washer', 'dryer', 'dishwasher', 'microwave', 'oven'],
      'climate_control': ['thermostat', 'air conditioner', 'heater', 'hvac'],
      'lighting': ['light', 'bulb', 'lamp', 'led strip', 'smart light'],
      'security': ['camera', 'doorbell', 'sensor', 'alarm', 'security'],
      'voice_assistant': ['echo', 'alexa', 'google home', 'siri', 'smart speaker'],
      'network': ['router', 'wifi', 'extender', 'mesh', 'modem'],
      'entertainment': ['soundbar', 'speaker', 'streaming', 'chromecast']
    };

    const lowerTitle = title.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  private inferCategoryFromModel(model: string): string {
    return this.inferCategoryFromTitle(model);
  }

  /**
   * Map category to device type
   */
  private mapCategoryToType(category: string): string {
    const typeMapping: Record<string, string> = {
      'tv': 'television',
      'smart_appliance': 'appliance',
      'climate_control': 'thermostat',
      'lighting': 'light',
      'security': 'camera',
      'voice_assistant': 'speaker',
      'network': 'router',
      'entertainment': 'media_device'
    };
    
    return typeMapping[category] || 'unknown';
  }
}

export const deviceDatabase = new DeviceDatabaseService();
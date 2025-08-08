/**
 * Comprehensive Smart Home Device Taxonomy
 * This file defines all supported smart home device categories, brands, and models.
 */

export interface DeviceTaxonomyCategory {
  name: string;
  displayName: string;
  description: string;
  icon: string; // Lucide icon name
  sortOrder: number;
  brands: {
    [brandName: string]: {
      displayName: string;
      website?: string;
      supportUrl?: string;
      commonModels: string[];
    };
  };
}

export const COMPREHENSIVE_DEVICE_TAXONOMY: Record<string, DeviceTaxonomyCategory> = {
  // Entertainment & Audio/Visual
  "tv": {
    name: "tv",
    displayName: "TV & Displays",
    description: "Smart TVs, displays, and entertainment screens",
    icon: "Tv",
    sortOrder: 1,
    brands: {
      "samsung": {
        displayName: "Samsung",
        website: "https://samsung.com",
        supportUrl: "https://samsung.com/support",
        commonModels: ["QN65Q70T", "UN55TU7000", "QN75Q80T", "Frame TV", "QN85QN90A", "UN43TU7000"]
      },
      "lg": {
        displayName: "LG",
        website: "https://lg.com",
        supportUrl: "https://lg.com/support",
        commonModels: ["OLED55C1PUB", "55UP7000PUA", "OLED65G1PUA", "55NANO75UPA", "OLED77C1PUB"]
      },
      "sony": {
        displayName: "Sony",
        website: "https://sony.com",
        supportUrl: "https://sony.com/support",
        commonModels: ["XBR55X900H", "XBR65A8H", "KD55X85K", "XBR75X950H", "KD65X80K"]
      },
      "tcl": {
        displayName: "TCL",
        website: "https://tcl.com",
        commonModels: ["55R635", "65R646", "75R646", "50S435", "65C825"]
      },
      "roku": {
        displayName: "Roku",
        website: "https://roku.com",
        commonModels: ["Roku TV", "Select Series", "Plus Series", "Pro Series"]
      },
      "apple": {
        displayName: "Apple",
        website: "https://apple.com",
        commonModels: ["Apple TV 4K", "Apple TV HD"]
      },
      "amazon": {
        displayName: "Amazon",
        website: "https://amazon.com",
        commonModels: ["Fire TV Stick", "Fire TV Cube", "Fire TV Stick 4K Max"]
      }
    }
  },

  "speaker": {
    name: "speaker",
    displayName: "Smart Speakers & Audio",
    description: "Voice assistants, smart speakers, and audio systems",
    icon: "Speaker",
    sortOrder: 2,
    brands: {
      "amazon": {
        displayName: "Amazon",
        website: "https://amazon.com",
        commonModels: ["Echo Dot (5th Gen)", "Echo (4th Gen)", "Echo Show 8", "Echo Studio", "Echo Show 15", "Echo Dot with Clock"]
      },
      "google": {
        displayName: "Google",
        website: "https://google.com",
        commonModels: ["Nest Audio", "Nest Mini", "Nest Hub (2nd Gen)", "Nest Hub Max", "Nest Hub"]
      },
      "apple": {
        displayName: "Apple",
        website: "https://apple.com",
        commonModels: ["HomePod", "HomePod Mini"]
      },
      "sonos": {
        displayName: "Sonos",
        website: "https://sonos.com",
        commonModels: ["One SL", "Beam", "Arc", "Move", "Roam", "Five", "Sub"]
      },
      "bose": {
        displayName: "Bose",
        website: "https://bose.com",
        commonModels: ["SoundLink Revolve", "Home Speaker 500", "SoundTouch 20"]
      },
      "jbl": {
        displayName: "JBL",
        website: "https://jbl.com",
        commonModels: ["Link Portable", "Link View", "Link Music"]
      }
    }
  },

  // Climate Control
  "thermostat": {
    name: "thermostat",
    displayName: "Thermostats & Climate",
    description: "Smart thermostats, HVAC controls, and climate sensors",
    icon: "Thermometer",
    sortOrder: 3,
    brands: {
      "nest": {
        displayName: "Google Nest",
        website: "https://nest.com",
        supportUrl: "https://nest.com/support",
        commonModels: ["Nest Learning Thermostat (4th Gen)", "Nest Thermostat", "Nest Thermostat E", "Nest Temperature Sensor"]
      },
      "ecobee": {
        displayName: "Ecobee",
        website: "https://ecobee.com",
        commonModels: ["SmartThermostat", "3 Lite", "4", "SmartSensor", "Switch+"]
      },
      "honeywell": {
        displayName: "Honeywell",
        website: "https://honeywell.com",
        commonModels: ["T6 Pro", "T9", "T10 Pro", "C7189U1005", "RTH9585WF"]
      },
      "emerson": {
        displayName: "Emerson",
        website: "https://emerson.com",
        commonModels: ["Sensi Touch", "Sensi", "UP500W"]
      },
      "johnson_controls": {
        displayName: "Johnson Controls",
        website: "https://johnsoncontrols.com",
        commonModels: ["GLAS", "T87RF2025"]
      }
    }
  },

  // Security & Monitoring
  "security_camera": {
    name: "security_camera",
    displayName: "Security Cameras",
    description: "Indoor/outdoor security cameras, video doorbells, and surveillance systems",
    icon: "Camera",
    sortOrder: 4,
    brands: {
      "ring": {
        displayName: "Ring",
        website: "https://ring.com",
        commonModels: ["Video Doorbell (2nd Gen)", "Stick Up Cam Battery", "Spotlight Cam Battery", "Floodlight Cam", "Indoor Cam", "Doorbell Pro 2"]
      },
      "nest": {
        displayName: "Google Nest",
        website: "https://nest.com",
        commonModels: ["Nest Cam (Indoor, Wired)", "Nest Cam (Outdoor)", "Nest Doorbell (Battery)", "Nest Cam IQ", "Nest Hub Max"]
      },
      "arlo": {
        displayName: "Arlo",
        website: "https://arlo.com",
        commonModels: ["Pro 4", "Essential", "Ultra 2", "Go 2", "Pro 3", "Essential Spotlight"]
      },
      "wyze": {
        displayName: "Wyze",
        website: "https://wyze.com",
        commonModels: ["Cam v3", "Cam Pan v3", "Video Doorbell", "Cam Outdoor", "Cam Floodlight"]
      },
      "blink": {
        displayName: "Blink",
        website: "https://blinkforhome.com",
        commonModels: ["Outdoor", "Indoor", "Mini", "XT2", "Sync Module 2"]
      },
      "eufy": {
        displayName: "Eufy Security",
        website: "https://eufy.com",
        commonModels: ["SoloCam S40", "Video Doorbell 2K", "Indoor Cam 2K", "Floodlight Cam 2 Pro"]
      }
    }
  },

  // Lighting
  "smart_light": {
    name: "smart_light",
    displayName: "Smart Lighting",
    description: "Smart bulbs, light switches, dimmers, and lighting systems",
    icon: "Lightbulb",
    sortOrder: 5,
    brands: {
      "philips_hue": {
        displayName: "Philips Hue",
        website: "https://philips-hue.com",
        commonModels: ["White and Color Ambiance A19", "White Ambiance A19", "Lightstrip Plus", "Dimmer Switch", "Motion Sensor", "Smart Button"]
      },
      "lifx": {
        displayName: "LIFX",
        website: "https://lifx.com",
        commonModels: ["A19", "BR30", "Lightstrip", "Candle Color", "Beam", "Tile"]
      },
      "tp_link_kasa": {
        displayName: "TP-Link Kasa",
        website: "https://kasasmart.com",
        commonModels: ["Smart Bulb KL110", "Smart Switch HS200", "Smart Dimmer HS220", "Light Strip KL400L5"]
      },
      "wyze": {
        displayName: "Wyze",
        website: "https://wyze.com",
        commonModels: ["Bulb Color", "Bulb White", "Light Strip", "Switch"]
      },
      "ge_cync": {
        displayName: "GE Cync",
        website: "https://cync.com",
        commonModels: ["Smart Switch", "Smart Dimmer", "Full Color A19", "Tunable White A19"]
      },
      "lutron": {
        displayName: "Lutron",
        website: "https://lutron.com",
        commonModels: ["Caseta Wireless Dimmer", "Aurora Smart Bulb Dimmer", "Claro Switch"]
      }
    }
  },

  // Access Control & Security
  "smart_lock": {
    name: "smart_lock",
    displayName: "Smart Locks & Access",
    description: "Smart door locks, deadbolts, and access control systems",
    icon: "Lock",
    sortOrder: 6,
    brands: {
      "august": {
        displayName: "August",
        website: "https://august.com",
        commonModels: ["Wi-Fi Smart Lock", "Smart Lock Pro", "Smart Keypad", "DoorSense"]
      },
      "yale": {
        displayName: "Yale",
        website: "https://yalehome.com",
        commonModels: ["Assure Lock SL", "Assure Lock", "Nest x Yale Lock", "Smart Cabinet Lock"]
      },
      "schlage": {
        displayName: "Schlage",
        website: "https://schlage.com",
        commonModels: ["Encode Smart WiFi Deadbolt", "Connect Smart Deadbolt", "Sense Smart Deadbolt"]
      },
      "kwikset": {
        displayName: "Kwikset",
        website: "https://kwikset.com",
        commonModels: ["Halo Touch", "SmartCode 916", "Premis", "Convert Smart Lock"]
      },
      "lockly": {
        displayName: "Lockly",
        website: "https://lockly.com",
        commonModels: ["Vision Elite", "Secure Plus", "Guard"]
      }
    }
  },

  // Power & Electrical
  "smart_plug": {
    name: "smart_plug",
    displayName: "Smart Plugs & Outlets",
    description: "Smart plugs, outlets, and power control devices",
    icon: "Plug",
    sortOrder: 7,
    brands: {
      "tp_link_kasa": {
        displayName: "TP-Link Kasa",
        website: "https://kasasmart.com",
        commonModels: ["Smart Plug HS100", "Smart Plug Mini HS105", "Smart Power Strip HS300", "Smart Outdoor Plug KP400"]
      },
      "amazon": {
        displayName: "Amazon",
        website: "https://amazon.com",
        commonModels: ["Smart Plug", "Smart Plug (Works with Alexa)"]
      },
      "wyze": {
        displayName: "Wyze",
        website: "https://wyze.com",
        commonModels: ["Plug", "Plug Outdoor"]
      },
      "ge_cync": {
        displayName: "GE Cync",
        website: "https://cync.com",
        commonModels: ["Smart Plug", "Smart Outlet", "Smart Switch"]
      },
      "leviton": {
        displayName: "Leviton",
        website: "https://leviton.com",
        commonModels: ["Smart Outlet", "Smart Switch", "Smart Dimmer"]
      }
    }
  },

  "smart_switch": {
    name: "smart_switch",
    displayName: "Smart Switches & Dimmers",
    description: "In-wall smart switches, dimmers, and electrical controls",
    icon: "ToggleRight",
    sortOrder: 8,
    brands: {
      "lutron": {
        displayName: "Lutron",
        website: "https://lutron.com",
        commonModels: ["Caseta Wireless Dimmer", "Caseta Wireless Switch", "Aurora Smart Bulb Dimmer", "Claro Switch"]
      },
      "tp_link_kasa": {
        displayName: "TP-Link Kasa",
        website: "https://kasasmart.com",
        commonModels: ["Smart Light Switch HS200", "Smart Dimmer Switch HS220", "3-Way Switch HS210"]
      },
      "ge_cync": {
        displayName: "GE Cync",
        website: "https://cync.com",
        commonModels: ["Smart Switch", "Smart Dimmer", "3-Way Smart Switch"]
      },
      "leviton": {
        displayName: "Leviton",
        website: "https://leviton.com",
        commonModels: ["Decora Smart Switch", "Decora Smart Dimmer", "Decora Smart GFCI Outlet"]
      },
      "inovelli": {
        displayName: "Inovelli",
        website: "https://inovelli.com",
        commonModels: ["Red Series Dimmer", "Black Series Switch", "Blue Series Switch"]
      }
    }
  },

  // Sensors & Monitoring
  "door_window_sensor": {
    name: "door_window_sensor",
    displayName: "Door & Window Sensors",
    description: "Entry sensors, contact sensors, and perimeter monitoring",
    icon: "DoorOpen",
    sortOrder: 9,
    brands: {
      "ring": {
        displayName: "Ring",
        website: "https://ring.com",
        commonModels: ["Alarm Contact Sensor", "Door/Window Sensor", "Retrofit Alarm Kit"]
      },
      "samsung_smartthings": {
        displayName: "Samsung SmartThings",
        website: "https://smartthings.com",
        commonModels: ["Multipurpose Sensor", "Window/Door Sensor"]
      },
      "wyze": {
        displayName: "Wyze",
        website: "https://wyze.com",
        commonModels: ["Sense Starter Kit", "Door/Window Sensor", "Motion Sensor"]
      },
      "aqara": {
        displayName: "Aqara",
        website: "https://aqara.com",
        commonModels: ["Door and Window Sensor P1", "Vibration Sensor", "Contact Sensor"]
      },
      "simplisafe": {
        displayName: "SimpliSafe",
        website: "https://simplisafe.com",
        commonModels: ["Entry Sensor", "Glass Break Sensor"]
      }
    }
  },

  "motion_sensor": {
    name: "motion_sensor",
    displayName: "Motion Sensors",
    description: "Motion detectors, occupancy sensors, and presence detection",
    icon: "Eye",
    sortOrder: 10,
    brands: {
      "philips_hue": {
        displayName: "Philips Hue",
        website: "https://philips-hue.com",
        commonModels: ["Motion Sensor", "Outdoor Motion Sensor"]
      },
      "ring": {
        displayName: "Ring",
        website: "https://ring.com",
        commonModels: ["Motion Detector", "Outdoor Motion Sensor"]
      },
      "samsung_smartthings": {
        displayName: "Samsung SmartThings",
        website: "https://smartthings.com",
        commonModels: ["Motion Sensor", "SmartThings Motion Sensor"]
      },
      "aqara": {
        displayName: "Aqara",
        website: "https://aqara.com",
        commonModels: ["Motion Sensor P1", "Human Body Sensor", "FP1 Presence Sensor"]
      },
      "ecobee": {
        displayName: "Ecobee",
        website: "https://ecobee.com",
        commonModels: ["SmartSensor", "Room Sensor Remote"]
      }
    }
  },

  // Garage & Automotive
  "garage_door": {
    name: "garage_door",
    displayName: "Garage Door Openers",
    description: "Smart garage door controllers and openers",
    icon: "Warehouse",
    sortOrder: 11,
    brands: {
      "chamberlain": {
        displayName: "Chamberlain",
        website: "https://chamberlain.com",
        commonModels: ["MyQ Smart Garage Door Opener", "B1381", "C450", "B503"]
      },
      "liftmaster": {
        displayName: "LiftMaster",
        website: "https://liftmaster.com",
        commonModels: ["8500W", "8360W", "3280-267", "MyQ Smart Garage Hub"]
      },
      "genie": {
        displayName: "Genie",
        website: "https://geniecompany.com",
        commonModels: ["Aladdin Connect", "ChainLift 550", "SilentMax 750"]
      },
      "nexx": {
        displayName: "Nexx",
        website: "https://nexx.com",
        commonModels: ["Smart Garage Controller", "NXG-100", "NXG-200"]
      },
      "garadget": {
        displayName: "Garadget",
        website: "https://garadget.com",
        commonModels: ["WiFi Smart Garage Door Controller"]
      }
    }
  },

  // Window Treatments
  "smart_blinds": {
    name: "smart_blinds",
    displayName: "Smart Blinds & Curtains",
    description: "Automated window treatments, blinds, and shade controllers",
    icon: "Move",
    sortOrder: 12,
    brands: {
      "lutron": {
        displayName: "Lutron",
        website: "https://lutron.com",
        commonModels: ["Serena Smart Shades", "Triathlon Smart Shades", "Palladiom Shades"]
      },
      "ikea": {
        displayName: "IKEA",
        website: "https://ikea.com",
        commonModels: ["FYRTUR", "KADRILJ", "Smart Blind"]
      },
      "switchbot": {
        displayName: "SwitchBot",
        website: "https://switchbot.com",
        commonModels: ["Curtain", "Blind Tilt", "Roll Shade"]
      },
      "hunter_douglas": {
        displayName: "Hunter Douglas",
        website: "https://hunterdouglas.com",
        commonModels: ["PowerView Automation", "Duette", "Silhouette"]
      },
      "somfy": {
        displayName: "Somfy",
        website: "https://somfy.com",
        commonModels: ["Automate Roller Shade Kit", "TaHoma Switch", "Motors for Blinds"]
      }
    }
  },

  // Air Quality & Environment
  "air_quality": {
    name: "air_quality",
    displayName: "Air Quality Monitors",
    description: "Air quality sensors, pollution monitors, and environmental detectors",
    icon: "Wind",
    sortOrder: 13,
    brands: {
      "awair": {
        displayName: "Awair",
        website: "https://awair.is",
        commonModels: ["Awair Element", "Awair 2nd Edition", "Awair Glow"]
      },
      "purpleair": {
        displayName: "PurpleAir",
        website: "https://purpleair.com",
        commonModels: ["PA-II", "PA-I", "Indoor Air Quality Monitor"]
      },
      "airthings": {
        displayName: "Airthings",
        website: "https://airthings.com",
        commonModels: ["Wave Plus", "Wave Mini", "View Plus", "Hub"]
      },
      "foobot": {
        displayName: "Foobot",
        website: "https://foobot.io",
        commonModels: ["Indoor Air Quality Monitor"]
      },
      "blueair": {
        displayName: "Blueair",
        website: "https://blueair.com",
        commonModels: ["Aware Air Quality Monitor", "Classic 205", "Blue Pure 211+"]
      }
    }
  },

  // Safety & Emergency
  "smoke_detector": {
    name: "smoke_detector",
    displayName: "Smart Smoke & CO Detectors",
    description: "Smoke alarms, carbon monoxide detectors, and safety devices",
    icon: "Flame",
    sortOrder: 14,
    brands: {
      "nest": {
        displayName: "Google Nest",
        website: "https://nest.com",
        commonModels: ["Nest Protect (2nd Generation)", "Nest Protect (Battery)", "Nest Protect (Wired)"]
      },
      "first_alert": {
        displayName: "First Alert",
        website: "https://firstalert.com",
        commonModels: ["Onelink Safe & Sound", "Onelink Smoke + CO", "SCO5CN"]
      },
      "kidde": {
        displayName: "Kidde",
        website: "https://kidde.com",
        commonModels: ["Smart Smoke + CO Detector", "RemoteLync Monitor", "KN-COPE-D"]
      },
      "roost": {
        displayName: "Roost",
        website: "https://roost.com",
        commonModels: ["Smart Smoke Alarm Battery", "Smart Water Leak Detector"]
      }
    }
  },

  "water_leak_sensor": {
    name: "water_leak_sensor",
    displayName: "Water Leak Sensors",
    description: "Water leak detectors, flood sensors, and moisture monitoring",
    icon: "Droplets",
    sortOrder: 15,
    brands: {
      "ring": {
        displayName: "Ring",
        website: "https://ring.com",
        commonModels: ["Alarm Flood & Freeze Sensor", "Smart Lighting Bridge"]
      },
      "samsung_smartthings": {
        displayName: "Samsung SmartThings",
        website: "https://smartthings.com",
        commonModels: ["Water Leak Sensor", "SmartThings Water Leak Sensor"]
      },
      "flo_by_moen": {
        displayName: "Flo by Moen",
        website: "https://meetflo.com",
        commonModels: ["Smart Water Shutoff", "Smart Water Detector", "Smart Water Monitor"]
      },
      "aqara": {
        displayName: "Aqara",
        website: "https://aqara.com",
        commonModels: ["Water Leak Sensor", "Flood Sensor"]
      },
      "govee": {
        displayName: "Govee",
        website: "https://govee.com",
        commonModels: ["WiFi Water Sensor", "Smart Water Alarm", "Water Detector"]
      }
    }
  },

  // Garden & Outdoor
  "irrigation": {
    name: "irrigation",
    displayName: "Smart Irrigation & Sprinklers",
    description: "Smart sprinkler controllers, irrigation systems, and garden automation",
    icon: "Sprout",
    sortOrder: 16,
    brands: {
      "rachio": {
        displayName: "Rachio",
        website: "https://rachio.com",
        commonModels: ["3 Smart Sprinkler Controller", "3e Smart Sprinkler Controller", "Wireless Flow Meter"]
      },
      "rain_bird": {
        displayName: "Rain Bird",
        website: "https://rainbird.com",
        commonModels: ["ST8I-2.0 Smart Indoor Timer", "ST8O-2.0 Smart Outdoor Timer", "LNK WiFi Module"]
      },
      "hunter": {
        displayName: "Hunter Industries",
        website: "https://hunterindustries.com",
        commonModels: ["Hydrawise Pro-HC", "X-Core", "Node-BT"]
      },
      "orbit": {
        displayName: "Orbit",
        website: "https://orbitsprinkler.com",
        commonModels: ["B-hyve Smart Indoor/Outdoor Timer", "B-hyve Smart Hose Faucet Timer"]
      },
      "netro": {
        displayName: "Netro",
        website: "https://netrohome.com",
        commonModels: ["Sprite Smart Sprinkler Controller", "Pixie Smart Hose Timer", "Whisperer Sensor"]
      }
    }
  },

  // Pool & Spa
  "pool_spa": {
    name: "pool_spa",
    displayName: "Pool & Spa Controllers",
    description: "Smart pool equipment, spa controllers, and water management systems",
    icon: "Waves",
    sortOrder: 17,
    brands: {
      "pentair": {
        displayName: "Pentair",
        website: "https://pentair.com",
        commonModels: ["ScreenLogic2 Interface", "IntelliCenter Pool Control", "EasyTouch Pool Control", "IntelliConnect"]
      },
      "hayward": {
        displayName: "Hayward",
        website: "https://hayward.com",
        commonModels: ["OmniLogic Smart Pool Control", "ProLogic Automation", "AquaConnect Home Network"]
      },
      "jandy": {
        displayName: "Jandy",
        website: "https://jandy.com",
        commonModels: ["AquaLink RS Pool Control", "iAquaLink Web Connect", "TruLink Automation"]
      },
      "iopool": {
        displayName: "iopool",
        website: "https://iopool.com",
        commonModels: ["EcO Smart Pool Monitor", "Start Smart Pool Monitor"]
      },
      "sutro": {
        displayName: "Sutro",
        website: "https://mysutro.com",
        commonModels: ["Smart Pool Monitor"]
      }
    }
  },

  // Kitchen & Appliances
  "smart_appliance": {
    name: "smart_appliance",
    displayName: "Smart Appliances",
    description: "Connected kitchen appliances, laundry, and home appliances",
    icon: "ChefHat",
    sortOrder: 18,
    brands: {
      "samsung": {
        displayName: "Samsung",
        website: "https://samsung.com",
        commonModels: ["Family Hub Refrigerator", "FlexWash Washer", "FlexDry Dryer", "Smart Oven", "Smart Dishwasher"]
      },
      "lg": {
        displayName: "LG",
        website: "https://lg.com",
        commonModels: ["InstaView Door-in-Door Refrigerator", "Smart ThinQ Washer", "Smart ThinQ Dryer", "Smart Oven", "Smart Dishwasher"]
      },
      "ge_appliances": {
        displayName: "GE Appliances",
        website: "https://geappliances.com",
        commonModels: ["Profile Smart Refrigerator", "Smart Washer", "Smart Dryer", "Smart Range", "Smart Dishwasher"]
      },
      "whirlpool": {
        displayName: "Whirlpool",
        website: "https://whirlpool.com",
        commonModels: ["Smart Refrigerator", "Smart Washer", "Smart Dryer", "Smart Range"]
      },
      "bosch": {
        displayName: "Bosch",
        website: "https://bosch-home.com",
        commonModels: ["800 Series Smart Dishwasher", "Smart Oven", "Smart Refrigerator"]
      },
      "june": {
        displayName: "June",
        website: "https://juneoven.com",
        commonModels: ["June Oven", "June Oven Premium"]
      }
    }
  },

  // Cleaning & Maintenance
  "robot_vacuum": {
    name: "robot_vacuum",
    displayName: "Robot Vacuums",
    description: "Smart robot vacuums, mops, and automated cleaning devices",
    icon: "RotateCcw",
    sortOrder: 19,
    brands: {
      "irobot": {
        displayName: "iRobot",
        website: "https://irobot.com",
        commonModels: ["Roomba j7+", "Roomba i7+", "Roomba 692", "Braava Jet m6", "Roomba Combo j7+"]
      },
      "shark": {
        displayName: "Shark",
        website: "https://sharkclean.com",
        commonModels: ["IQ Robot Self-Empty", "AI Robot", "Matrix Robot"]
      },
      "roborock": {
        displayName: "Roborock",
        website: "https://roborock.com",
        commonModels: ["S7 MaxV Ultra", "Q7 Max+", "S5 Max", "E4"]
      },
      "eufy": {
        displayName: "Eufy",
        website: "https://eufy.com",
        commonModels: ["RoboVac 11S", "RoboVac X8", "RoboVac G30"]
      },
      "ecovacs": {
        displayName: "Ecovacs",
        website: "https://ecovacs.com",
        commonModels: ["Deebot Ozmo T8 AIVI", "Deebot N79S", "Deebot X1 Omni"]
      },
      "tineco": {
        displayName: "Tineco",
        website: "https://tineco.com",
        commonModels: ["Pure One S12", "Floor ONE S3", "A11 Master"]
      }
    }
  },

  // Networking & Infrastructure
  "router_wifi": {
    name: "router_wifi",
    displayName: "Routers & WiFi Systems",
    description: "Smart routers, mesh systems, and network infrastructure",
    icon: "Router",
    sortOrder: 20,
    brands: {
      "eero": {
        displayName: "Eero",
        website: "https://eero.com",
        commonModels: ["Pro 6E", "Pro 6", "6", "Beacon", "6+"]
      },
      "netgear": {
        displayName: "Netgear",
        website: "https://netgear.com",
        commonModels: ["Orbi AX6000", "Nighthawk AX12", "Nighthawk Pro Gaming", "Orbi Voice"]
      },
      "linksys": {
        displayName: "Linksys",
        website: "https://linksys.com",
        commonModels: ["Velop AX4200", "Max-Stream EA8300", "MR9000", "EA9500"]
      },
      "asus": {
        displayName: "ASUS",
        website: "https://asus.com",
        commonModels: ["AiMesh AX6100", "RT-AX88U", "ZenWiFi AX6600", "RT-AC86U"]
      },
      "tp_link": {
        displayName: "TP-Link",
        website: "https://tp-link.com",
        commonModels: ["Deco X68", "Archer AX73", "Deco M5", "Archer C7"]
      },
      "google": {
        displayName: "Google",
        website: "https://google.com",
        commonModels: ["Nest Wifi Pro 6E", "Nest Wifi", "Google Wifi"]
      }
    }
  },

  // Health & Wellness
  "smart_mirror": {
    name: "smart_mirror",
    displayName: "Smart Mirrors",
    description: "Smart bathroom mirrors, fitness mirrors, and interactive displays",
    icon: "Mirror",
    sortOrder: 21,
    brands: {
      "himirror": {
        displayName: "HiMirror",
        website: "https://himirror.com",
        commonModels: ["Plus", "Mini", "Slide"]
      },
      "tonal": {
        displayName: "Tonal",
        website: "https://tonal.com",
        commonModels: ["Tonal Home Gym"]
      },
      "mirror": {
        displayName: "Mirror",
        website: "https://mirror.co",
        commonModels: ["The Mirror Home Gym"]
      },
      "capstone": {
        displayName: "Capstone",
        website: "https://capstone-technologies.com",
        commonModels: ["Smart Mirror", "Connected Mirror"]
      },
      "simplehuman": {
        displayName: "simplehuman",
        website: "https://simplehuman.com",
        commonModels: ["Sensor Mirror Hi-Fi", "Sensor Mirror Pro", "Wide-View Sensor Mirror"]
      }
    }
  },

  // Pet & Family
  "pet_device": {
    name: "pet_device",
    displayName: "Pet & Animal Devices",
    description: "Smart pet feeders, doors, cameras, and animal monitoring",
    icon: "Heart",
    sortOrder: 22,
    brands: {
      "furbo": {
        displayName: "Furbo",
        website: "https://furbo.com",
        commonModels: ["360° Dog Camera", "Dog Camera", "Cat Camera"]
      },
      "petcube": {
        displayName: "Petcube",
        website: "https://petcube.com",
        commonModels: ["Bites 2", "Cam", "Play 2"]
      },
      "sureflap": {
        displayName: "SureFlap",
        website: "https://sureflap.com",
        commonModels: ["Microchip Pet Door", "Pet Feeder", "Animo Activity Monitor"]
      },
      "whistle": {
        displayName: "Whistle",
        website: "https://whistle.com",
        commonModels: ["GO Explore", "FIT", "Switch Smart Collar"]
      },
      "petnet": {
        displayName: "Petnet",
        website: "https://petnet.io",
        commonModels: ["SmartFeeder", "SmartBowl"]
      }
    }
  },

  // Voice & AI Assistants (Standalone)
  "voice_assistant": {
    name: "voice_assistant",
    displayName: "Voice Assistants & AI",
    description: "Dedicated voice assistants, AI companions, and smart displays",
    icon: "MessageCircle",
    sortOrder: 23,
    brands: {
      "amazon": {
        displayName: "Amazon",
        website: "https://amazon.com",
        commonModels: ["Echo Show 15", "Echo Show 10", "Echo Show 8", "Echo Show 5", "Echo Auto"]
      },
      "google": {
        displayName: "Google",
        website: "https://google.com",
        commonModels: ["Nest Hub Max", "Nest Hub (2nd Gen)", "Nest Hub"]
      },
      "facebook": {
        displayName: "Meta",
        website: "https://portal.facebook.com",
        commonModels: ["Portal", "Portal+", "Portal Mini", "Portal TV"]
      },
      "lenovo": {
        displayName: "Lenovo",
        website: "https://lenovo.com",
        commonModels: ["Smart Display", "Smart Clock", "Smart Tab"]
      },
      "jbl": {
        displayName: "JBL",
        website: "https://jbl.com",
        commonModels: ["Link View", "Link Bar"]
      }
    }
  },

  // Energy & Solar
  "energy_monitor": {
    name: "energy_monitor",
    displayName: "Energy & Solar Systems",
    description: "Smart energy monitors, solar panels, batteries, and power management",
    icon: "Zap",
    sortOrder: 24,
    brands: {
      "sense": {
        displayName: "Sense",
        website: "https://sense.com",
        commonModels: ["Home Energy Monitor", "Solar Monitor"]
      },
      "tesla": {
        displayName: "Tesla",
        website: "https://tesla.com",
        commonModels: ["Powerwall", "Solar Panels", "Solar Roof"]
      },
      "enphase": {
        displayName: "Enphase",
        website: "https://enphase.com",
        commonModels: ["IQ Battery", "IQ Microinverter", "Envoy"]
      },
      "generac": {
        displayName: "Generac",
        website: "https://generac.com",
        commonModels: ["PWRcell", "Guardian Generator"]
      },
      "emporia_vue": {
        displayName: "Emporia Vue",
        website: "https://emporiaenergy.com",
        commonModels: ["Vue Energy Monitor", "Smart Plugs"]
      }
    }
  },

  // Custom Category (Always last)
  "custom_other": {
    name: "custom_other",
    displayName: "Other/Custom Devices",
    description: "User-defined devices and categories not covered by standard types",
    icon: "Settings",
    sortOrder: 999,
    brands: {
      "generic": {
        displayName: "Generic/Unknown",
        commonModels: ["Custom Device", "Unknown Model"]
      },
      "other": {
        displayName: "Other Brand",
        commonModels: ["Custom Model"]
      }
    }
  }
};

// Helper functions
export const getCategoryByName = (name: string): DeviceTaxonomyCategory | undefined => {
  return COMPREHENSIVE_DEVICE_TAXONOMY[name];
};

export const getAllCategories = (): DeviceTaxonomyCategory[] => {
  return Object.values(COMPREHENSIVE_DEVICE_TAXONOMY).sort((a, b) => a.sortOrder - b.sortOrder);
};

export const getCategoriesByType = (includeCustom: boolean = true): DeviceTaxonomyCategory[] => {
  const categories = getAllCategories();
  return includeCustom ? categories : categories.filter(cat => cat.name !== 'custom_other');
};

export const getBrandsForCategory = (categoryName: string): string[] => {
  const category = getCategoryByName(categoryName);
  return category ? Object.keys(category.brands) : [];
};

export const getModelsForBrand = (categoryName: string, brandName: string): string[] => {
  const category = getCategoryByName(categoryName);
  if (!category || !category.brands[brandName]) return [];
  return category.brands[brandName].commonModels;
};

export const searchDevices = (query: string): Array<{
  category: string;
  brand: string;
  model: string;
  score: number;
}> => {
  const results: Array<{ category: string; brand: string; model: string; score: number }> = [];
  const searchTerm = query.toLowerCase();

  Object.entries(COMPREHENSIVE_DEVICE_TAXONOMY).forEach(([categoryName, category]) => {
    // Search in category names
    if (category.displayName.toLowerCase().includes(searchTerm)) {
      results.push({ category: categoryName, brand: '', model: '', score: 100 });
    }

    // Search in brands and models
    Object.entries(category.brands).forEach(([brandName, brand]) => {
      if (brand.displayName.toLowerCase().includes(searchTerm)) {
        results.push({ category: categoryName, brand: brandName, model: '', score: 80 });
      }

      brand.commonModels.forEach(model => {
        if (model.toLowerCase().includes(searchTerm)) {
          results.push({ category: categoryName, brand: brandName, model, score: 60 });
        }
      });
    });
  });

  return results.sort((a, b) => b.score - a.score);
};
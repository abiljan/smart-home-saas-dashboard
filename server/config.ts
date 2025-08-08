/**
 * Environment configuration and validation
 */

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL?: string;
  OPENAI_API_KEY?: string;
}

/**
 * Validate and parse environment variables
 */
export function validateEnvironment(): EnvConfig {
  const config: EnvConfig = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  // Validate required fields
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
    console.warn(`NODE_ENV '${config.NODE_ENV}' is not a standard value. Expected: development, production, or test`);
  }

  // Optional environment variables warnings
  if (!config.DATABASE_URL) {
    console.warn('DATABASE_URL not configured. Application will use in-memory storage.');
    console.warn('Data will be lost when the application restarts.');
  }

  if (!config.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not configured. AI-powered features will be disabled.');
  }

  return config;
}

/**
 * Get validated environment configuration
 */
export const env = validateEnvironment();

/**
 * Logger utility with proper levels
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
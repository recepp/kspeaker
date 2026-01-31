interface Config {
  API_BASE_URL: string;
  API_KEY?: string;
  ADMIN_API_KEY?: string;
}

// Default configuration
const defaultConfig: Config = {
  API_BASE_URL: 'https://kartezya-ai.up.railway.app'
};

// Try to load environment variables
let envConfig: Partial<Config> = {};
try {
  // Using require for dynamic import of environment variables
  const env = require('@env');
  if (env.API_BASE_URL) {
    envConfig.API_BASE_URL = env.API_BASE_URL;
  }
  if (env.API_KEY) {
    envConfig.API_KEY = env.API_KEY;
  }
  if (env.ADMIN_API_KEY) {
    envConfig.ADMIN_API_KEY = env.ADMIN_API_KEY;
  }
} catch (error) {
  console.log('Environment variables not loaded, using defaults');
}

// Merge configurations
export const config: Config = {
  ...defaultConfig,
  ...envConfig
};
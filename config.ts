interface Config {
  API_BASE_URL: string;
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
} catch (error) {
  console.log('Environment variables not loaded, using defaults');
}

// Merge configurations
export const config: Config = {
  ...defaultConfig,
  ...envConfig
};
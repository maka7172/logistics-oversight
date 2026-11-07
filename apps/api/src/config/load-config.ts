import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

export const loadAppConfig = () => {
  const possiblePaths = [
    join(process.cwd(), '../../config/app.config.yaml'),
    join(process.cwd(), '../config/app.config.yaml'),
    join(process.cwd(), 'config/app.config.yaml'),
    '/config/app.config.yaml',
  ];

  let config: Record<string, any> = {};
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      const raw = readFileSync(p, 'utf8');
      config = yaml.load(raw) as Record<string, any>;
      break;
    }
  }

  // Merge with process.env overrides for critical keys
  return {
    ...config,
    API_PORT: parseInt(process.env.API_PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
};

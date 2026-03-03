import * as os from 'os';
import * as path from 'path';

/**
 * Get current platform (exposed for testing)
 */
export function getPlatform(): NodeJS.Platform {
  return os.platform();
}

/**
 * Check if running on Windows
 */
export function isWindows(platform: NodeJS.Platform = getPlatform()): boolean {
  return platform === 'win32';
}

/**
 * Check if running on macOS
 */
export function isMac(platform: NodeJS.Platform = getPlatform()): boolean {
  return platform === 'darwin';
}

/**
 * Get user's home directory
 */
export function getHomeDir(): string {
  return os.homedir();
}

/**
 * Get the path to the ember-mcp gateway entry file
 * This is the compiled JavaScript file that Claude Code runs as an MCP server
 */
export const EMBER_MCP_PATH = 'D:/NodejsP/ember-mcp/dist/index.js';

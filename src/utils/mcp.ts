import * as fs from 'fs';
import * as path from 'path';
import { EMBER_MCP_PATH } from './platform.js';

/**
 * The MCP server name used in configuration
 */
export const MCP_SERVER_NAME = 'ember-mcp';

/**
 * MCP configuration structure for ember-mcp gateway mode
 */
export interface McpConfig {
  mcpServers: {
    [key: string]: {
      type: string;
      command: string;
      args: string[];
      env: Record<string, string>;
    };
  };
}

/**
 * Get the MCP configuration object for ember-mcp gateway
 *
 * @returns MCP configuration object
 */
export function getMcpConfigObject(): McpConfig {
  return {
    mcpServers: {
      [MCP_SERVER_NAME]: {
        type: 'stdio',
        command: 'node',
        args: [EMBER_MCP_PATH],
        env: {
          EMBER_PORT: '4000',
          LOG_LEVEL: 'info'
        }
      }
    }
  };
}

/**
 * Generate and write the .mcp.json configuration file to a project directory
 *
 * @param projectPath - Path to the project directory
 */
export function generateMcpConfig(projectPath: string): void {
  const config = getMcpConfigObject();
  const configPath = path.join(projectPath, '.mcp.json');

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Check if a project has an .mcp.json file
 */
export function hasMcpConfig(projectPath: string): boolean {
  const configPath = path.join(projectPath, '.mcp.json');
  return fs.existsSync(configPath);
}

/**
 * Check if ember-mcp gateway exists
 */
export function emberMcpExists(): boolean {
  return fs.existsSync(EMBER_MCP_PATH);
}

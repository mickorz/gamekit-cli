import * as fs from 'fs';

/**
 * Add the MCP package to an existing manifest.json
 * Preserves all existing packages and other manifest properties
 *
 * @param manifestPath - Path to the manifest.json file
 * @param unityVersion - Unity version string (e.g., "6000.1.0f1") - unused but kept for API compatibility
 */
export function addMcpToManifest(manifestPath: string, unityVersion: string): void {
  const content = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  // Ensure dependencies object exists
  manifest.dependencies = manifest.dependencies || {};

  // Add ember-mcp package from local path
  manifest.dependencies['com.kiff.ember-unitymcp'] = 'file:D:/NodejsP/ember-mcp/UnityPackage';

  // Add essential Unity packages for game development
  addEssentialPackages(manifest);

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Add essential Unity packages for game development
 * These packages are commonly needed but may not be in all project templates
 *
 * @param manifest - The parsed manifest.json object
 */
function addEssentialPackages(manifest: { dependencies: Record<string, string> }): void {
  // Unity UI (uGUI) - Required for Canvas, Text, Button, Slider, etc.
  // Without this package, UI scripts will fail to compile
  if (!manifest.dependencies['com.unity.ugui']) {
    manifest.dependencies['com.unity.ugui'] = '1.0.0';
  }

  // TextMeshPro - Modern text rendering (optional but commonly used)
  // Many Unity versions include this by default, but ensure it exists
  if (!manifest.dependencies['com.unity.textmeshpro']) {
    manifest.dependencies['com.unity.textmeshpro'] = '3.0.6';
  }

  // Input System - New input system for better control handling
  // Required for some modern Unity projects
  if (!manifest.dependencies['com.unity.inputsystem']) {
    manifest.dependencies['com.unity.inputsystem'] = '1.7.0';
  }

  // Rider IDE Support - JetBrains Rider integration
  // Provides better C# intellisense, debugging and refactoring support
  if (!manifest.dependencies['com.unity.ide.rider']) {
    manifest.dependencies['com.unity.ide.rider'] = '3.0.39';
  }
}

import fs from 'node:fs';
import { preferencesPath } from './paths.js';

export interface Preferences {
  defaultEngine?: string;
}

export function loadPreferences(): Preferences {
  try {
    return JSON.parse(fs.readFileSync(preferencesPath(), 'utf-8'));
  } catch {
    return {};
  }
}

export function savePreferences(prefs: Preferences): void {
  fs.writeFileSync(preferencesPath(), JSON.stringify(prefs, null, 2) + '\n');
}

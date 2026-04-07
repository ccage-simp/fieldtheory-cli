/**
 * LLM engine detection, selection, and invocation.
 *
 * Knows how to call `claude` and `codex` out of the box.
 * Remembers the user's choice in ~/.ft-bookmarks/.preferences.
 */

import { execFileSync } from 'node:child_process';
import { loadPreferences, savePreferences } from './preferences.js';

// ── Engine registry ────────────────────────────────────────────────────

export interface EngineConfig {
  bin: string;
  args: (prompt: string) => string[];
}

const KNOWN_ENGINES: Record<string, EngineConfig> = {
  claude: { bin: 'claude', args: (p) => ['-p', '--output-format', 'text', p] },
  codex:  { bin: 'codex',  args: (p) => ['exec', p] },
};

/** Order used when auto-detecting. */
const PREFERENCE_ORDER = ['claude', 'codex'];

// ── Detection ──────────────────────────────────────────────────────────

function isOnPath(bin: string): boolean {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function detectAvailableEngines(): string[] {
  return PREFERENCE_ORDER.filter((name) => isOnPath(KNOWN_ENGINES[name].bin));
}

// ── Interactive prompt ─────────────────────────────────────────────────

async function askYesNo(question: string): Promise<boolean> {
  const { createInterface } = await import('node:readline');
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith('y'));
    });
  });
}

// ── Resolution ─────────────────────────────────────────────────────────

export interface ResolvedEngine {
  name: string;
  config: EngineConfig;
}

function resolve(name: string): ResolvedEngine {
  return { name, config: KNOWN_ENGINES[name] };
}

/**
 * Resolve which engine to use for classification.
 *
 * 1. If a saved default exists and is available, use it silently.
 * 2. If only one engine is available, use it silently.
 * 3. If multiple are available and stdin is a TTY, prompt y/n through
 *    the preference order and persist the choice.
 * 4. If not a TTY (CI/scripts), use the first available without prompting.
 *
 * Throws if no engine is found.
 */
export async function resolveEngine(): Promise<ResolvedEngine> {
  const available = detectAvailableEngines();

  if (available.length === 0) {
    throw new Error(
      'No supported LLM CLI found.\n' +
      'Install one of the following and log in:\n' +
      '  - Claude Code: https://docs.anthropic.com/en/docs/claude-code\n' +
      '  - Codex CLI:   https://github.com/openai/codex'
    );
  }

  // Check saved preference
  const prefs = loadPreferences();
  if (prefs.defaultEngine && available.includes(prefs.defaultEngine)) {
    return resolve(prefs.defaultEngine);
  }

  // Single engine — just use it
  if (available.length === 1) {
    return resolve(available[0]);
  }

  // Multiple engines — prompt if TTY, else use first
  if (!process.stdin.isTTY) {
    return resolve(available[0]);
  }

  for (const name of available) {
    const yes = await askYesNo(`  Use ${name} for classification? (y/n): `);
    if (yes) {
      savePreferences({ ...prefs, defaultEngine: name });
      process.stderr.write(`  \u2713 ${name} set as default (change anytime: ft model)\n`);
      return resolve(name);
    }
  }

  // Said no to everything — use first anyway but don't persist
  process.stderr.write(`  Using ${available[0]} (no default saved)\n`);
  return resolve(available[0]);
}

// ── Invocation ─────────────────────────────────────────────────────────

export function invokeEngine(engine: ResolvedEngine, prompt: string): string {
  const { bin, args } = engine.config;
  return execFileSync(bin, args(prompt), {
    encoding: 'utf-8',
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
    stdio: ['pipe', 'pipe', 'ignore'],
  }).trim();
}

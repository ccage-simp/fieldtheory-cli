import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildIndex } from '../src/bookmarks-db.js';
import { renderViz } from '../src/bookmarks-viz.js';

// Mix of legacy Twitter date strings and new v1.3.0 ISO timestamps
const FIXTURES = [
  {
    id: '1', tweetId: '1', url: 'https://x.com/alice/status/1', text: 'Legacy Date Bookmark', authorHandle: 'alice', authorName: 'Alice',
    syncedAt: '2026-01-01T00:00:00Z', 
    postedAt: 'Sat Mar 28 10:00:00 +0000 2020', 
    bookmarkedAt: 'Sat Mar 28 18:55:23 +0000 2020', // Hour 18
    language: 'en', engagement: { likeCount: 100 }, mediaObjects: [], links: [], tags: [], ingestedVia: 'graphql'
  },
  {
    id: '2', tweetId: '2', url: 'https://x.com/bob/status/2', text: 'ISO Date Bookmark', authorHandle: 'bob', authorName: 'Bob',
    syncedAt: '2026-02-01T00:00:00Z', 
    postedAt: '2024-11-26T00:00:00Z', 
    bookmarkedAt: '2024-11-27T10:53:54.664Z', // Hour 10
    language: 'en', engagement: { likeCount: 50 }, mediaObjects: [], links: [], tags: [], ingestedVia: 'graphql'
  },
  {
    id: '3', tweetId: '3', url: 'https://x.com/charlie/status/3', text: 'Malformed Legacy Date Bookmark', authorHandle: 'charlie', authorName: 'Charlie',
    syncedAt: '2026-03-01T00:00:00Z', 
    postedAt: '2022', 
    bookmarkedAt: 'ShortDate', // Simulating malformed data
    language: 'en', engagement: { likeCount: 50 }, mediaObjects: [], links: [], tags: [], ingestedVia: 'graphql'
  }
];

async function withIsolatedDataDir(fn: () => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'ft-test-viz-'));
  const jsonl = FIXTURES.map((r) => JSON.stringify(r)).join('\n') + '\n';
  await writeFile(path.join(dir, 'bookmarks.jsonl'), jsonl);

  const saved = process.env.FT_DATA_DIR;
  process.env.FT_DATA_DIR = dir;
  try {
    await fn();
  } finally {
    process.env.FT_DATA_DIR = saved;
  }
}

test('renderViz: correctly parses and renders both ISO and legacy date formats', async () => {
  await withIsolatedDataDir(async () => {
    await buildIndex();
    
    const output = await renderViz();
    
    // 1. Check RHYTHM chart (monthly labels)
    // Legacy: "Sat Mar 28 ... 2020" -> "Mar 2020"
    assert.ok(output.includes('Mar 2020'), 'Failed to parse legacy month format for Rhythm chart');
    // ISO: "2024-11-27T..." -> "Nov 2024"
    assert.ok(output.includes('Nov 2024'), 'Failed to parse ISO month format for Rhythm chart');
    // Ensure we don't have the "00" gibberish fallback
    assert.ok(!output.includes('00 2020') && !output.includes('00 2024'), 'Fallback 00 month was unexpectedly used');

    // 2. Check TIME CAPSULES
    // Legacy: "Sat Mar 28 ... 2020" -> "2020" and " Mar 28"
    assert.ok(output.includes('2020'), 'Failed to render legacy year in Time Capsules');
    assert.ok(output.includes('Mar 28'), 'Failed to render legacy month/day in Time Capsules');
    // ISO: "2024-11-26T..." -> "2024" and "Nov 26"
    // 3. Check DAILY ARC (hourly buckets)
    // Legacy bookmark is at 18:55 (Hour 18)
    assert.ok(output.includes('18:00'), 'Failed to render legacy hour format in Daily Arc');
    // ISO bookmark is at 10:53 (Hour 10)
    assert.ok(output.includes('10:00'), 'Failed to render ISO hour format in Daily Arc');
    
    // CRITICAL: Check the malformed 'ShortDate' bookmark.
    // Without the `length > 13` guard, SQLite evaluates `CAST(substr('ShortDate', 12, 2) AS INTEGER)`
    // as CAST('' AS INTEGER), which silently outputs `0` (Midnight).
    // Because we only have two valid bookmarks (at 18 and 10), "00:00" should NOT be present.
    assert.ok(!output.includes('00:00'), 'Malformed date incorrectly fell back to Midnight (00) due to missing length guard');
  });
});

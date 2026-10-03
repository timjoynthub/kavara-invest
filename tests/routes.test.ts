import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resources } from '../src/data/resources.ts';

test('all resources retain the established capture and download routes', () => {
  assert.deepEqual(Object.values(resources).map(({ capturePath, thanksPath }) => [capturePath, thanksPath]), [
    ['/get-blueprint/', '/thank-you-blueprint/'],
    ['/small-group-entry/', '/small-group-entry-download/'],
    ['/10-questions-for-investors/', '/10-questions-for-investors-download/']
  ]);
});

test('all resource downloads use the existing Kavara destinations', () => {
  for (const resource of Object.values(resources)) {
    const url = new URL(resource.downloadUrl);
    assert.match(url.hostname, /(^|\.)kavaracapital\.com$/);
    assert.equal(url.protocol, 'https:');
  }
});

test('secret and private-reference patterns are excluded from git', () => {
  const ignore = readFileSync(resolve('.gitignore'), 'utf8');
  for (const pattern of ['.env.*', '.dev.vars', 'private-source/', 'reference-material/', '*.pdf', '*.xlsx', '*.zip']) {
    assert.ok(ignore.includes(pattern), `missing ignore pattern: ${pattern}`);
  }
});

test('resource submissions also enter the shared nurture group', () => {
  const handler = readFileSync(resolve('functions/api/subscribe.ts'), 'utf8');
  assert.match(handler, /MAILERLITE_GROUP_NURTURE_ENTRY/);
  assert.match(handler, /groups:\s*\[groupId, nurtureGroupId\]/);
});

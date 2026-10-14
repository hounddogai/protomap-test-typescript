import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCsatQuotaStore } from "./fallback-csat-quota-store.js";
import { newFallbackCsatQuota } from "./fallback-csat-quota.js";

test("MemoryFallbackCsatQuotaStore finds what it saved", () => {
  const store = newMemoryFallbackCsatQuotaStore();
  const item = newFallbackCsatQuota("code-595", "title-165");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

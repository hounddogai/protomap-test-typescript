import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedRetentionTierStore } from "./batched-retention-tier-store.js";
import { newBatchedRetentionTier } from "./batched-retention-tier.js";

test("MemoryBatchedRetentionTierStore finds what it saved", () => {
  const store = newMemoryBatchedRetentionTierStore();
  const item = newBatchedRetentionTier("code-925", "name-840");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

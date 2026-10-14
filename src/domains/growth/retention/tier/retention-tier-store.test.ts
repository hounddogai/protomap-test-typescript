import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionTierStore } from "./retention-tier-store.js";
import { newRetentionTier } from "./retention-tier.js";

test("MemoryRetentionTierStore finds what it saved", () => {
  const store = newMemoryRetentionTierStore();
  const item = newRetentionTier("code-423", "title-168");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

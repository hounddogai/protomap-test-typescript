import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySuppressionTierStore } from "./primary-suppression-tier-store.js";
import { newPrimarySuppressionTier } from "./primary-suppression-tier.js";

test("MemoryPrimarySuppressionTierStore finds what it saved", () => {
  const store = newMemoryPrimarySuppressionTierStore();
  const item = newPrimarySuppressionTier("code-791", "title-539");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

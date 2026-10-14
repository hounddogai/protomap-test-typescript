import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationTierStore } from "./reputation-tier-store.js";
import { newReputationTier } from "./reputation-tier.js";

test("MemoryReputationTierStore finds what it saved", () => {
  const store = newMemoryReputationTierStore();
  const item = newReputationTier("code-750", "title-787");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

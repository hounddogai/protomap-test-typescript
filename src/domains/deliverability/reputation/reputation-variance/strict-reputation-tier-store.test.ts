import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReputationTierStore } from "./strict-reputation-tier-store.js";
import { newStrictReputationTier } from "./strict-reputation-tier.js";

test("MemoryStrictReputationTierStore finds what it saved", () => {
  const store = newMemoryStrictReputationTierStore();
  const item = newStrictReputationTier("code-788", "label-923");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

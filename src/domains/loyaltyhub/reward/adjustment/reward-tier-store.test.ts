import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardTierStore } from "./reward-tier-store.js";
import { newRewardTier } from "./reward-tier.js";

test("MemoryRewardTierStore finds what it saved", () => {
  const store = newMemoryRewardTierStore();
  const item = newRewardTier("code-167", "name-357");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveStreakTierStore } from "./adaptive-streak-tier-store.js";
import { newAdaptiveStreakTier } from "./adaptive-streak-tier.js";

test("MemoryAdaptiveStreakTierStore finds what it saved", () => {
  const store = newMemoryAdaptiveStreakTierStore();
  const item = newAdaptiveStreakTier("code-561", "label-219");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

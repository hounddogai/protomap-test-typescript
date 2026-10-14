import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyStreakTierStore } from "./legacy-streak-tier-store.js";
import { newLegacyStreakTier } from "./legacy-streak-tier.js";

test("MemoryLegacyStreakTierStore finds what it saved", () => {
  const store = newMemoryLegacyStreakTierStore();
  const item = newLegacyStreakTier("code-855", "name-675");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalActivationTierStore } from "./seasonal-activation-tier-store.js";
import { newSeasonalActivationTier } from "./seasonal-activation-tier.js";

test("MemorySeasonalActivationTierStore finds what it saved", () => {
  const store = newMemorySeasonalActivationTierStore();
  const item = newSeasonalActivationTier("code-152", "name-151");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingRedemptionVarianceStore } from "./rolling-redemption-variance-store.js";
import { newRollingRedemptionVariance } from "./rolling-redemption-variance.js";

test("MemoryRollingRedemptionVarianceStore finds what it saved", () => {
  const store = newMemoryRollingRedemptionVarianceStore();
  const item = newRollingRedemptionVariance("code-889", "name-554");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

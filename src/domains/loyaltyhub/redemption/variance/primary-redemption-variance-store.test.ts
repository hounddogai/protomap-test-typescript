import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryRedemptionVarianceStore } from "./primary-redemption-variance-store.js";
import { newPrimaryRedemptionVariance } from "./primary-redemption-variance.js";

test("MemoryPrimaryRedemptionVarianceStore finds what it saved", () => {
  const store = newMemoryPrimaryRedemptionVarianceStore();
  const item = newPrimaryRedemptionVariance("code-7", "name-193");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredActivationEstimateStore } from "./tiered-activation-estimate-store.js";
import { newTieredActivationEstimate } from "./tiered-activation-estimate.js";

test("MemoryTieredActivationEstimateStore finds what it saved", () => {
  const store = newMemoryTieredActivationEstimateStore();
  const item = newTieredActivationEstimate("code-912", "name-439");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

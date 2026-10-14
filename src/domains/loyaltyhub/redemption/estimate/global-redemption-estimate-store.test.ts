import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRedemptionEstimateStore } from "./global-redemption-estimate-store.js";
import { newGlobalRedemptionEstimate } from "./global-redemption-estimate.js";

test("MemoryGlobalRedemptionEstimateStore finds what it saved", () => {
  const store = newMemoryGlobalRedemptionEstimateStore();
  const item = newGlobalRedemptionEstimate("code-926", "name-123");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

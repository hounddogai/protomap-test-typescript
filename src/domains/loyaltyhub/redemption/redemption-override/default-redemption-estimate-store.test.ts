import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultRedemptionEstimateStore } from "./default-redemption-estimate-store.js";
import { newDefaultRedemptionEstimate } from "./default-redemption-estimate.js";

test("MemoryDefaultRedemptionEstimateStore finds what it saved", () => {
  const store = newMemoryDefaultRedemptionEstimateStore();
  const item = newDefaultRedemptionEstimate("code-748", "title-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

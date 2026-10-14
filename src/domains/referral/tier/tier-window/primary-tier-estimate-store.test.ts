import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTierEstimateStore } from "./primary-tier-estimate-store.js";
import { newPrimaryTierEstimate } from "./primary-tier-estimate.js";

test("MemoryPrimaryTierEstimateStore finds what it saved", () => {
  const store = newMemoryPrimaryTierEstimateStore();
  const item = newPrimaryTierEstimate("code-224", "label-568");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

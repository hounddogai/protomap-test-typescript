import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierEstimateStore } from "./tier-estimate-store.js";
import { newTierEstimate } from "./tier-estimate.js";

test("MemoryTierEstimateStore finds what it saved", () => {
  const store = newMemoryTierEstimateStore();
  const item = newTierEstimate("code-574", "name-373");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

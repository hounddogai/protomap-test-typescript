import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledSuppressionEstimateStore } from "./scheduled-suppression-estimate-store.js";
import { newScheduledSuppressionEstimate } from "./scheduled-suppression-estimate.js";

test("MemoryScheduledSuppressionEstimateStore finds what it saved", () => {
  const store = newMemoryScheduledSuppressionEstimateStore();
  const item = newScheduledSuppressionEstimate("code-360", "name-235");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

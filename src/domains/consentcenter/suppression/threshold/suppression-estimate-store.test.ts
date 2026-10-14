import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionEstimateStore } from "./suppression-estimate-store.js";
import { newSuppressionEstimate } from "./suppression-estimate.js";

test("MemorySuppressionEstimateStore finds what it saved", () => {
  const store = newMemorySuppressionEstimateStore();
  const item = newSuppressionEstimate("code-256", "name-750");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

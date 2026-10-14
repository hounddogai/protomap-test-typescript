import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSuppressionThresholdStore } from "./lenient-suppression-threshold-store.js";
import { newLenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

test("MemoryLenientSuppressionThresholdStore finds what it saved", () => {
  const store = newMemoryLenientSuppressionThresholdStore();
  const item = newLenientSuppressionThreshold("code-258", "name-137");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

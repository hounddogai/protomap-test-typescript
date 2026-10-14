import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionThresholdStore } from "./suppression-threshold-store.js";
import { newSuppressionThreshold } from "./suppression-threshold.js";

test("MemorySuppressionThresholdStore finds what it saved", () => {
  const store = newMemorySuppressionThresholdStore();
  const item = newSuppressionThreshold("code-513", "name-991");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

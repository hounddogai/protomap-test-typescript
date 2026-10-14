import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBounceThresholdStore } from "./manual-bounce-threshold-store.js";
import { newManualBounceThreshold } from "./manual-bounce-threshold.js";

test("MemoryManualBounceThresholdStore finds what it saved", () => {
  const store = newMemoryManualBounceThresholdStore();
  const item = newManualBounceThreshold("code-897", "name-689");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

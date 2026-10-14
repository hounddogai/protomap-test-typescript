import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredConversionThresholdStore } from "./tiered-conversion-threshold-store.js";
import { newTieredConversionThreshold } from "./tiered-conversion-threshold.js";

test("MemoryTieredConversionThresholdStore finds what it saved", () => {
  const store = newMemoryTieredConversionThresholdStore();
  const item = newTieredConversionThreshold("code-347", "label-455");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

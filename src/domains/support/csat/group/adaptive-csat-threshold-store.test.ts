import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCsatThresholdStore } from "./adaptive-csat-threshold-store.js";
import { newAdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

test("MemoryAdaptiveCsatThresholdStore finds what it saved", () => {
  const store = newMemoryAdaptiveCsatThresholdStore();
  const item = newAdaptiveCsatThreshold("code-826", "label-374");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

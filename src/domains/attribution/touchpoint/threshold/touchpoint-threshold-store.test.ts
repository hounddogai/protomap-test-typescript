import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointThresholdStore } from "./touchpoint-threshold-store.js";
import { newTouchpointThreshold } from "./touchpoint-threshold.js";

test("MemoryTouchpointThresholdStore finds what it saved", () => {
  const store = newMemoryTouchpointThresholdStore();
  const item = newTouchpointThreshold("code-287", "label-439");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

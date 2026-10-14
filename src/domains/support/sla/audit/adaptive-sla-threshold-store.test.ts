import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveSlaThresholdStore } from "./adaptive-sla-threshold-store.js";
import { newAdaptiveSlaThreshold } from "./adaptive-sla-threshold.js";

test("MemoryAdaptiveSlaThresholdStore finds what it saved", () => {
  const store = newMemoryAdaptiveSlaThresholdStore();
  const item = newAdaptiveSlaThreshold("code-358", "name-94");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

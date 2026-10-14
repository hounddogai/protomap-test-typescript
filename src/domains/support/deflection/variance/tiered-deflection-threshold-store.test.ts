import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDeflectionThresholdStore } from "./tiered-deflection-threshold-store.js";
import { newTieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

test("MemoryTieredDeflectionThresholdStore finds what it saved", () => {
  const store = newMemoryTieredDeflectionThresholdStore();
  const item = newTieredDeflectionThreshold("code-49", "label-599");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSlaThresholdStore } from "./rolling-sla-threshold-store.js";
import { newRollingSlaThreshold } from "./rolling-sla-threshold.js";

test("MemoryRollingSlaThresholdStore finds what it saved", () => {
  const store = newMemoryRollingSlaThresholdStore();
  const item = newRollingSlaThreshold("code-8", "title-262");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

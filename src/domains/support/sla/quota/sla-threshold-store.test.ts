import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaThresholdStore } from "./sla-threshold-store.js";
import { newSlaThreshold } from "./sla-threshold.js";

test("MemorySlaThresholdStore finds what it saved", () => {
  const store = newMemorySlaThresholdStore();
  const item = newSlaThreshold("code-932", "name-945");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

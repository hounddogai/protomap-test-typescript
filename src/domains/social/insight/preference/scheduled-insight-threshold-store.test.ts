import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledInsightThresholdStore } from "./scheduled-insight-threshold-store.js";
import { newScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

test("MemoryScheduledInsightThresholdStore finds what it saved", () => {
  const store = newMemoryScheduledInsightThresholdStore();
  const item = newScheduledInsightThreshold("code-145", "name-903");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

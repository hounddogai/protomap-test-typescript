import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalInsightThresholdStore } from "./global-insight-threshold-store.js";
import { newGlobalInsightThreshold } from "./global-insight-threshold.js";

test("MemoryGlobalInsightThresholdStore finds what it saved", () => {
  const store = newMemoryGlobalInsightThresholdStore();
  const item = newGlobalInsightThreshold("code-79", "title-115");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

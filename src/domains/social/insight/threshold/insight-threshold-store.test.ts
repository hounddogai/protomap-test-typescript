import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightThresholdStore } from "./insight-threshold-store.js";
import { newInsightThreshold } from "./insight-threshold.js";

test("MemoryInsightThresholdStore finds what it saved", () => {
  const store = newMemoryInsightThresholdStore();
  const item = newInsightThreshold("code-201", "name-669");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

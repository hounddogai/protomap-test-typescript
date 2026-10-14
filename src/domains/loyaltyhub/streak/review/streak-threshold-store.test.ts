import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakThresholdStore } from "./streak-threshold-store.js";
import { newStreakThreshold } from "./streak-threshold.js";

test("MemoryStreakThresholdStore finds what it saved", () => {
  const store = newMemoryStreakThresholdStore();
  const item = newStreakThreshold("code-450", "name-846");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

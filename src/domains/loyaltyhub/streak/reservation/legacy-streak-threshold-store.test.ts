import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyStreakThresholdStore } from "./legacy-streak-threshold-store.js";
import { newLegacyStreakThreshold } from "./legacy-streak-threshold.js";

test("MemoryLegacyStreakThresholdStore finds what it saved", () => {
  const store = newMemoryLegacyStreakThresholdStore();
  const item = newLegacyStreakThreshold("code-594", "label-768");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

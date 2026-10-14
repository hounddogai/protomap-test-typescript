import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierThresholdStore } from "./tier-threshold-store.js";
import { newTierThreshold } from "./tier-threshold.js";

test("MemoryTierThresholdStore finds what it saved", () => {
  const store = newMemoryTierThresholdStore();
  const item = newTierThreshold("code-995", "label-156");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInThresholdStore } from "./double-opt-in-threshold-store.js";
import { newDoubleOptInThreshold } from "./double-opt-in-threshold.js";

test("MemoryDoubleOptInThresholdStore finds what it saved", () => {
  const store = newMemoryDoubleOptInThresholdStore();
  const item = newDoubleOptInThreshold("code-833", "title-637");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

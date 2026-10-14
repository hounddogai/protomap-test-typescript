import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeThresholdStore } from "./nudge-threshold-store.js";
import { newNudgeThreshold } from "./nudge-threshold.js";

test("MemoryNudgeThresholdStore finds what it saved", () => {
  const store = newMemoryNudgeThresholdStore();
  const item = newNudgeThreshold("code-321", "label-601");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

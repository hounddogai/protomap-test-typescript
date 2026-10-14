import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingStepVarianceStore } from "./rolling-step-variance-store.js";
import { newRollingStepVariance } from "./rolling-step-variance.js";

test("MemoryRollingStepVarianceStore finds what it saved", () => {
  const store = newMemoryRollingStepVarianceStore();
  const item = newRollingStepVariance("code-707", "label-82");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledModelVarianceStore } from "./scheduled-model-variance-store.js";
import { newScheduledModelVariance } from "./scheduled-model-variance.js";

test("MemoryScheduledModelVarianceStore finds what it saved", () => {
  const store = newMemoryScheduledModelVarianceStore();
  const item = newScheduledModelVariance("code-411", "name-327");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

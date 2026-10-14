import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStepVarianceStore } from "./capped-step-variance-store.js";
import { newCappedStepVariance } from "./capped-step-variance.js";

test("MemoryCappedStepVarianceStore finds what it saved", () => {
  const store = newMemoryCappedStepVarianceStore();
  const item = newCappedStepVariance("code-224", "title-323");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

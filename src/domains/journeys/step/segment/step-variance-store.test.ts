import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepVarianceStore } from "./step-variance-store.js";
import { newStepVariance } from "./step-variance.js";

test("MemoryStepVarianceStore finds what it saved", () => {
  const store = newMemoryStepVarianceStore();
  const item = newStepVariance("code-703", "name-371");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

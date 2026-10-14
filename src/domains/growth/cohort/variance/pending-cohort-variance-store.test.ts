import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCohortVarianceStore } from "./pending-cohort-variance-store.js";
import { newPendingCohortVariance } from "./pending-cohort-variance.js";

test("MemoryPendingCohortVarianceStore finds what it saved", () => {
  const store = newMemoryPendingCohortVarianceStore();
  const item = newPendingCohortVariance("code-371", "label-402");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

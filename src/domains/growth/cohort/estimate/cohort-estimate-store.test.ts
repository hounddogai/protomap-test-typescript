import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortEstimateStore } from "./cohort-estimate-store.js";
import { newCohortEstimate } from "./cohort-estimate.js";

test("MemoryCohortEstimateStore finds what it saved", () => {
  const store = newMemoryCohortEstimateStore();
  const item = newCohortEstimate("code-773", "name-933");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

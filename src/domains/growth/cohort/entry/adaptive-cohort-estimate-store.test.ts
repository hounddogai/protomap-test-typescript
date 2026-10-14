import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCohortEstimateStore } from "./adaptive-cohort-estimate-store.js";
import { newAdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

test("MemoryAdaptiveCohortEstimateStore finds what it saved", () => {
  const store = newMemoryAdaptiveCohortEstimateStore();
  const item = newAdaptiveCohortEstimate("code-891", "name-356");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

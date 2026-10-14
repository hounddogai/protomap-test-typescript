import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredCohortAdjustmentStore } from "./tiered-cohort-adjustment-store.js";
import { newTieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

test("MemoryTieredCohortAdjustmentStore finds what it saved", () => {
  const store = newMemoryTieredCohortAdjustmentStore();
  const item = newTieredCohortAdjustment("code-301", "name-698");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

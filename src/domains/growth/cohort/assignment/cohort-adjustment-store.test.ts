import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortAdjustmentStore } from "./cohort-adjustment-store.js";
import { newCohortAdjustment } from "./cohort-adjustment.js";

test("MemoryCohortAdjustmentStore finds what it saved", () => {
  const store = newMemoryCohortAdjustmentStore();
  const item = newCohortAdjustment("code-698", "name-479");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

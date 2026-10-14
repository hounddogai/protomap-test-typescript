import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryCohortAdjustmentStore } from "./primary-cohort-adjustment-store.js";
import { newPrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

test("MemoryPrimaryCohortAdjustmentStore finds what it saved", () => {
  const store = newMemoryPrimaryCohortAdjustmentStore();
  const item = newPrimaryCohortAdjustment("code-898", "label-82");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

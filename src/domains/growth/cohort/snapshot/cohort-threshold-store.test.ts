import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortThresholdStore } from "./cohort-threshold-store.js";
import { newCohortThreshold } from "./cohort-threshold.js";

test("MemoryCohortThresholdStore finds what it saved", () => {
  const store = newMemoryCohortThresholdStore();
  const item = newCohortThreshold("code-199", "label-4");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

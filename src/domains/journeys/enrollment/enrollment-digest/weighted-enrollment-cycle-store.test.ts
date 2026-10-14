import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedEnrollmentCycleStore } from "./weighted-enrollment-cycle-store.js";
import { newWeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

test("MemoryWeightedEnrollmentCycleStore finds what it saved", () => {
  const store = newMemoryWeightedEnrollmentCycleStore();
  const item = newWeightedEnrollmentCycle("code-576", "label-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

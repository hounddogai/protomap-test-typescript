import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCohortExceptionStore } from "./weighted-cohort-exception-store.js";
import { newWeightedCohortException } from "./weighted-cohort-exception.js";

test("MemoryWeightedCohortExceptionStore finds what it saved", () => {
  const store = newMemoryWeightedCohortExceptionStore();
  const item = newWeightedCohortException("code-24", "label-544");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

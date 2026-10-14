import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledCohortExceptionStore } from "./scheduled-cohort-exception-store.js";
import { newScheduledCohortException } from "./scheduled-cohort-exception.js";

test("MemoryScheduledCohortExceptionStore finds what it saved", () => {
  const store = newMemoryScheduledCohortExceptionStore();
  const item = newScheduledCohortException("code-182", "name-742");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

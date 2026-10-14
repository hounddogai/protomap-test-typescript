import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingCohortExceptionStore } from "./rolling-cohort-exception-store.js";
import { newRollingCohortException } from "./rolling-cohort-exception.js";

test("MemoryRollingCohortExceptionStore finds what it saved", () => {
  const store = newMemoryRollingCohortExceptionStore();
  const item = newRollingCohortException("code-77", "name-748");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

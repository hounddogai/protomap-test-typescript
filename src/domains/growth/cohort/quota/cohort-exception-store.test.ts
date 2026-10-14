import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortExceptionStore } from "./cohort-exception-store.js";
import { newCohortException } from "./cohort-exception.js";

test("MemoryCohortExceptionStore finds what it saved", () => {
  const store = newMemoryCohortExceptionStore();
  const item = newCohortException("code-150", "name-488");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

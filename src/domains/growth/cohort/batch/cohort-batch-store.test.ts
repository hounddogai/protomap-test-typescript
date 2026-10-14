import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortBatchStore } from "./cohort-batch-store.js";
import { newCohortBatch } from "./cohort-batch.js";

test("MemoryCohortBatchStore finds what it saved", () => {
  const store = newMemoryCohortBatchStore();
  const item = newCohortBatch("code-472", "name-693");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

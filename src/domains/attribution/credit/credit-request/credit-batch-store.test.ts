import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditBatchStore } from "./credit-batch-store.js";
import { newCreditBatch } from "./credit-batch.js";

test("MemoryCreditBatchStore finds what it saved", () => {
  const store = newMemoryCreditBatchStore();
  const item = newCreditBatch("code-868", "name-943");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

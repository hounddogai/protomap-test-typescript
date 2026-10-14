import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedCreditRequestStore } from "./batched-credit-request-store.js";
import { newBatchedCreditRequest } from "./batched-credit-request.js";

test("MemoryBatchedCreditRequestStore finds what it saved", () => {
  const store = newMemoryBatchedCreditRequestStore();
  const item = newBatchedCreditRequest("code-848", "name-86");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

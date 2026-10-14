import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedCreditRecordStore } from "./batched-credit-record-store.js";
import { newBatchedCreditRecord } from "./batched-credit-record.js";

test("MemoryBatchedCreditRecordStore finds what it saved", () => {
  const store = newMemoryBatchedCreditRecordStore();
  const item = newBatchedCreditRecord("code-54", "title-699");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

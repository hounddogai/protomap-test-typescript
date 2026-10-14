import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedConversionRecordStore } from "./batched-conversion-record-store.js";
import { newBatchedConversionRecord } from "./batched-conversion-record.js";

test("MemoryBatchedConversionRecordStore finds what it saved", () => {
  const store = newMemoryBatchedConversionRecordStore();
  const item = newBatchedConversionRecord("code-763", "label-81");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

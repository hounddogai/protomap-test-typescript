import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedTierRecordStore } from "./batched-tier-record-store.js";
import { newBatchedTierRecord } from "./batched-tier-record.js";

test("MemoryBatchedTierRecordStore finds what it saved", () => {
  const store = newMemoryBatchedTierRecordStore();
  const item = newBatchedTierRecord("code-334", "label-136");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

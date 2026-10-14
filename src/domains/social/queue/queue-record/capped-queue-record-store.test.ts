import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedQueueRecordStore } from "./capped-queue-record-store.js";
import { newCappedQueueRecord } from "./capped-queue-record.js";

test("MemoryCappedQueueRecordStore finds what it saved", () => {
  const store = newMemoryCappedQueueRecordStore();
  const item = newCappedQueueRecord("code-419", "title-101");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

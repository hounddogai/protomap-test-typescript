import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingQueueRecordStore } from "./rolling-queue-record-store.js";
import { newRollingQueueRecord } from "./rolling-queue-record.js";

test("MemoryRollingQueueRecordStore finds what it saved", () => {
  const store = newMemoryRollingQueueRecordStore();
  const item = newRollingQueueRecord("code-706", "name-94");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

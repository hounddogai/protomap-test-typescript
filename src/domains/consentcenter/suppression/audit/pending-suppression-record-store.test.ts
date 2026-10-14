import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingSuppressionRecordStore } from "./pending-suppression-record-store.js";
import { newPendingSuppressionRecord } from "./pending-suppression-record.js";

test("MemoryPendingSuppressionRecordStore finds what it saved", () => {
  const store = newMemoryPendingSuppressionRecordStore();
  const item = newPendingSuppressionRecord("code-518", "label-817");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

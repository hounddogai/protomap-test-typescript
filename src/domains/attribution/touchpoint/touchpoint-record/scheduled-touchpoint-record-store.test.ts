import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledTouchpointRecordStore } from "./scheduled-touchpoint-record-store.js";
import { newScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

test("MemoryScheduledTouchpointRecordStore finds what it saved", () => {
  const store = newMemoryScheduledTouchpointRecordStore();
  const item = newScheduledTouchpointRecord("code-691", "label-393");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

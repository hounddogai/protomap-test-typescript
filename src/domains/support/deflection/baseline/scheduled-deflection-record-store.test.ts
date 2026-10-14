import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDeflectionRecordStore } from "./scheduled-deflection-record-store.js";
import { newScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

test("MemoryScheduledDeflectionRecordStore finds what it saved", () => {
  const store = newMemoryScheduledDeflectionRecordStore();
  const item = newScheduledDeflectionRecord("code-123", "label-323");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

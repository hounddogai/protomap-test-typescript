import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionRecordStore } from "./suppression-record-store.js";
import { newSuppressionRecord } from "./suppression-record.js";

test("MemorySuppressionRecordStore finds what it saved", () => {
  const store = newMemorySuppressionRecordStore();
  const item = newSuppressionRecord("code-929", "title-586");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

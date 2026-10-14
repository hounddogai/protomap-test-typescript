import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSuppressionRecordStore } from "./global-suppression-record-store.js";
import { newGlobalSuppressionRecord } from "./global-suppression-record.js";

test("MemoryGlobalSuppressionRecordStore finds what it saved", () => {
  const store = newMemoryGlobalSuppressionRecordStore();
  const item = newGlobalSuppressionRecord("code-170", "name-528");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

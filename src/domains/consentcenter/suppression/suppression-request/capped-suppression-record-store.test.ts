import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedSuppressionRecordStore } from "./capped-suppression-record-store.js";
import { newCappedSuppressionRecord } from "./capped-suppression-record.js";

test("MemoryCappedSuppressionRecordStore finds what it saved", () => {
  const store = newMemoryCappedSuppressionRecordStore();
  const item = newCappedSuppressionRecord("code-990", "name-734");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

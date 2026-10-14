import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckRecordStore } from "./fraud-check-record-store.js";
import { newFraudCheckRecord } from "./fraud-check-record.js";

test("MemoryFraudCheckRecordStore finds what it saved", () => {
  const store = newMemoryFraudCheckRecordStore();
  const item = newFraudCheckRecord("code-274", "title-619");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditRecordStore } from "./credit-record-store.js";
import { newCreditRecord } from "./credit-record.js";

test("MemoryCreditRecordStore finds what it saved", () => {
  const store = newMemoryCreditRecordStore();
  const item = newCreditRecord("code-910", "label-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

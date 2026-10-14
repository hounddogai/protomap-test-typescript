import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualCreditRecordStore } from "./manual-credit-record-store.js";
import { newManualCreditRecord } from "./manual-credit-record.js";

test("MemoryManualCreditRecordStore finds what it saved", () => {
  const store = newMemoryManualCreditRecordStore();
  const item = newManualCreditRecord("code-374", "name-896");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

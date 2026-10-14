import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFraudCheckRecordStore } from "./rolling-fraud-check-record-store.js";
import { newRollingFraudCheckRecord } from "./rolling-fraud-check-record.js";

test("MemoryRollingFraudCheckRecordStore finds what it saved", () => {
  const store = newMemoryRollingFraudCheckRecordStore();
  const item = newRollingFraudCheckRecord("code-697", "title-815");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

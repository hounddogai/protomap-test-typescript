import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPayoutRecordStore } from "./primary-payout-record-store.js";
import { newPrimaryPayoutRecord } from "./primary-payout-record.js";

test("MemoryPrimaryPayoutRecordStore finds what it saved", () => {
  const store = newMemoryPrimaryPayoutRecordStore();
  const item = newPrimaryPayoutRecord("code-943", "name-876");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

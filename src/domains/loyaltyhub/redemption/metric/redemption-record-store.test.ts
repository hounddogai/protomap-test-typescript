import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionRecordStore } from "./redemption-record-store.js";
import { newRedemptionRecord } from "./redemption-record.js";

test("MemoryRedemptionRecordStore finds what it saved", () => {
  const store = newMemoryRedemptionRecordStore();
  const item = newRedemptionRecord("code-967", "label-464");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

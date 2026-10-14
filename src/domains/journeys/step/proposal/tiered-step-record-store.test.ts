import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredStepRecordStore } from "./tiered-step-record-store.js";
import { newTieredStepRecord } from "./tiered-step-record.js";

test("MemoryTieredStepRecordStore finds what it saved", () => {
  const store = newMemoryTieredStepRecordStore();
  const item = newTieredStepRecord("code-678", "label-299");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

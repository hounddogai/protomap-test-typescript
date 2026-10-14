import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedExitRuleRecordStore } from "./batched-exit-rule-record-store.js";
import { newBatchedExitRuleRecord } from "./batched-exit-rule-record.js";

test("MemoryBatchedExitRuleRecordStore finds what it saved", () => {
  const store = newMemoryBatchedExitRuleRecordStore();
  const item = newBatchedExitRuleRecord("code-58", "label-836");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

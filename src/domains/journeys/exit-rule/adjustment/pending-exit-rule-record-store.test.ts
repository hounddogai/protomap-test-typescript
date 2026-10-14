import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingExitRuleRecordStore } from "./pending-exit-rule-record-store.js";
import { newPendingExitRuleRecord } from "./pending-exit-rule-record.js";

test("MemoryPendingExitRuleRecordStore finds what it saved", () => {
  const store = newMemoryPendingExitRuleRecordStore();
  const item = newPendingExitRuleRecord("code-787", "name-819");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

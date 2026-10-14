import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredEscalationRecordStore } from "./tiered-escalation-record-store.js";
import { newTieredEscalationRecord } from "./tiered-escalation-record.js";

test("MemoryTieredEscalationRecordStore finds what it saved", () => {
  const store = newMemoryTieredEscalationRecordStore();
  const item = newTieredEscalationRecord("code-443", "name-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalEscalationRecordStore } from "./global-escalation-record-store.js";
import { newGlobalEscalationRecord } from "./global-escalation-record.js";

test("MemoryGlobalEscalationRecordStore finds what it saved", () => {
  const store = newMemoryGlobalEscalationRecordStore();
  const item = newGlobalEscalationRecord("code-413", "name-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

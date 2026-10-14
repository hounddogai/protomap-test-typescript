import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleRecordStore } from "./exit-rule-record-store.js";
import { newExitRuleRecord } from "./exit-rule-record.js";

test("MemoryExitRuleRecordStore finds what it saved", () => {
  const store = newMemoryExitRuleRecordStore();
  const item = newExitRuleRecord("code-278", "label-207");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

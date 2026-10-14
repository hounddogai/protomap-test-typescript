import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleRecordStore } from "./bid-rule-record-store.js";
import { newBidRuleRecord } from "./bid-rule-record.js";

test("MemoryBidRuleRecordStore finds what it saved", () => {
  const store = newMemoryBidRuleRecordStore();
  const item = newBidRuleRecord("code-50", "title-78");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

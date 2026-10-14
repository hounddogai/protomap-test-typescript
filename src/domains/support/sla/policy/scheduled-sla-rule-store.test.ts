import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledSlaRuleStore } from "./scheduled-sla-rule-store.js";
import { newScheduledSlaRule } from "./scheduled-sla-rule.js";

test("MemoryScheduledSlaRuleStore finds what it saved", () => {
  const store = newMemoryScheduledSlaRuleStore();
  const item = newScheduledSlaRule("code-718", "title-388");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

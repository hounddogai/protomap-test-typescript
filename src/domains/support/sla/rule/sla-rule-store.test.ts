import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaRuleStore } from "./sla-rule-store.js";
import { newSlaRule } from "./sla-rule.js";

test("MemorySlaRuleStore finds what it saved", () => {
  const store = newMemorySlaRuleStore();
  const item = newSlaRule("code-428", "label-585");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

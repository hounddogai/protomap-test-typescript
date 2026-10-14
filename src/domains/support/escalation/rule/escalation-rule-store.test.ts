import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationRuleStore } from "./escalation-rule-store.js";
import { newEscalationRule } from "./escalation-rule.js";

test("MemoryEscalationRuleStore finds what it saved", () => {
  const store = newMemoryEscalationRuleStore();
  const item = newEscalationRule("code-518", "label-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

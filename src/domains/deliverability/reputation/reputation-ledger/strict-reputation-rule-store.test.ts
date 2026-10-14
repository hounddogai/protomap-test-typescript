import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReputationRuleStore } from "./strict-reputation-rule-store.js";
import { newStrictReputationRule } from "./strict-reputation-rule.js";

test("MemoryStrictReputationRuleStore finds what it saved", () => {
  const store = newMemoryStrictReputationRuleStore();
  const item = newStrictReputationRule("code-887", "label-686");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalRuleStore } from "./approval-rule-store.js";
import { newApprovalRule } from "./approval-rule.js";

test("MemoryApprovalRuleStore finds what it saved", () => {
  const store = newMemoryApprovalRuleStore();
  const item = newApprovalRule("code-174", "title-876");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

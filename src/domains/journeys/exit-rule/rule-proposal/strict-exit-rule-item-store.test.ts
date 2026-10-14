import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictExitRuleItemStore } from "./strict-exit-rule-item-store.js";
import { newStrictExitRuleItem } from "./strict-exit-rule-item.js";

test("MemoryStrictExitRuleItemStore finds what it saved", () => {
  const store = newMemoryStrictExitRuleItemStore();
  const item = newStrictExitRuleItem("code-128", "label-323");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

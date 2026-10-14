import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleItemStore } from "./exit-rule-item-store.js";
import { newExitRuleItem } from "./exit-rule-item.js";

test("MemoryExitRuleItemStore finds what it saved", () => {
  const store = newMemoryExitRuleItemStore();
  const item = newExitRuleItem("code-530", "label-890");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingExitRuleItemStore } from "./pending-exit-rule-item-store.js";
import { newPendingExitRuleItem } from "./pending-exit-rule-item.js";

test("MemoryPendingExitRuleItemStore finds what it saved", () => {
  const store = newMemoryPendingExitRuleItemStore();
  const item = newPendingExitRuleItem("code-741", "label-488");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

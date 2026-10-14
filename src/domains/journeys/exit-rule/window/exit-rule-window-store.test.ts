import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleWindowStore } from "./exit-rule-window-store.js";
import { newExitRuleWindow } from "./exit-rule-window.js";

test("MemoryExitRuleWindowStore finds what it saved", () => {
  const store = newMemoryExitRuleWindowStore();
  const item = newExitRuleWindow("code-417", "name-805");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

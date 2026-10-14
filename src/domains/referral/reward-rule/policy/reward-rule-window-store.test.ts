import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleWindowStore } from "./reward-rule-window-store.js";
import { newRewardRuleWindow } from "./reward-rule-window.js";

test("MemoryRewardRuleWindowStore finds what it saved", () => {
  const store = newMemoryRewardRuleWindowStore();
  const item = newRewardRuleWindow("code-720", "name-859");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
